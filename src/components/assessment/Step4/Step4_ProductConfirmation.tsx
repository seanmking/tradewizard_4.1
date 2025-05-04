import React, { useState, useMemo, useEffect } from 'react';
import { useAssessmentContext, Product } from '@/contexts/AssessmentContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Check, X, Pencil, Search, Trash2 } from 'lucide-react';
import SarahAvatarAbstract from '@/src/components/ui/SarahAvatarAbstract';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

/**
 * Step 4: Product Confirmation Panel
 * Extracted from WebsiteAnalysisCenter
 */
const Step4_ProductConfirmation: React.FC = () => {
  const { state, dispatch, goToNextStep, goToPreviousStep } = useAssessmentContext();
  const { products, isLoading, fullName } = state;

  // Debug: dump products payload to console for grouping inspection
  useEffect(() => {
    console.log('DEBUG: fetched products payload:', state.products);
  }, [state.products]);

  const [editingHsCodeProductId, setEditingHsCodeProductId] = React.useState<string | null>(null);
  const [tempHsCode, setTempHsCode] = React.useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [newProductData, setNewProductData] = React.useState({ name: '', category: '' });
  const [editingProductId, setEditingProductId] = React.useState<string | null>(null);
  const [editFormData, setEditFormData] = React.useState({ name: '', category: '' });
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [tempGroupHsCode, setTempGroupHsCode] = useState<string>('');

  const productsList = products.filter(p => !p.user_hidden);
  const hasProducts = productsList.length > 0;

  // Group products by their group_id (fallback to own id)
  const groupedProducts = useMemo(() => {
    // If no explicit group_id, fallback group by category
    const hasExplicitGroups = productsList.some(p => p.group_id != null);
    if (!hasExplicitGroups) {
      const mapCat: Record<string, { parent: Product; variants: Product[] }> = {};
      productsList.forEach(p => {
        const key = p.category || p.id;
        if (!mapCat[key]) {
          mapCat[key] = { parent: p, variants: [] };
        } else {
          mapCat[key].variants.push(p);
        }
      });
      return Object.values(mapCat);
    }
    // Group by explicit group_id
    const mapGrp: Record<string, { parent: Product; variants: Product[] }> = {};
    productsList.forEach(p => {
      const key = p.group_id || p.id;
      if (!mapGrp[key]) {
        const parent = p.group_id ? productsList.find(x => x.id === p.group_id) : p;
        mapGrp[key] = { parent: parent || p, variants: [] };
      }
      if (p.group_id === key) {
        mapGrp[key].variants.push(p);
      }
    });
    return Object.values(mapGrp);
  }, [productsList]);

  const getGroupConfirmedCode = (groupKey: string): string | null => {
    const codes = products
      .filter(p => p.group_id === groupKey || p.id === groupKey)
      .map(p => p.confirmed_hs_code)
      .filter(Boolean);
    const unique = Array.from(new Set(codes));
    if (unique.length === 1) return unique[0] as string;
    if (!codes.length) return null;
    return 'Multiple';
  };

  const getGroupConfidence = (groupKey: string): number => {
    const scores = products
      .filter(p => p.group_id === groupKey || p.id === groupKey)
      .map(p => p.confidence_score || 0);
    if (!scores.length) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const getGroupClassificationConfidence = (groupKey: string): number => {
    const scores = products
      .filter(p => p.group_id === groupKey || p.id === groupKey)
      .map(p => (p.classification_confidence ?? 0) * 100);
    if (!scores.length) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const handleConfirmHsCode = (productId: string, estimatedCode: string) => dispatch({ type: 'UPDATE_PRODUCT_HS_CODE', payload: { productId, hsCode: estimatedCode } });
  const handleFindHsCode = (productId: string) => { const mock = prompt('HS Code Lookup', '1234.56'); if (mock) dispatch({ type: 'UPDATE_PRODUCT_HS_CODE', payload: { productId, hsCode: mock } }); };
  const handleEditHsCode = (product: Product) => { setEditingHsCodeProductId(product.id); setTempHsCode(product.confirmed_hs_code || product.estimated_hs_code || ''); };
  const handleSaveHsCode = (productId: string) => { dispatch({ type: 'UPDATE_PRODUCT_HS_CODE', payload: { productId, hsCode: tempHsCode } }); setEditingHsCodeProductId(null); setTempHsCode(''); };
  const handleCancelEditHsCode = () => { setEditingHsCodeProductId(null); setTempHsCode(''); };

  const handleSaveNewProduct = async () => {
    if (!newProductData.name.trim()) { alert('Name required'); return; }
    if (!state.assessmentId) { alert('No assessment'); return; }
    const res = await fetch(`/api/assessment/${state.assessmentId}/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newProductData) });
    const data = await res.json(); dispatch({ type: 'ADD_PRODUCT_STATE', payload: data }); setNewProductData({ name: '', category: '' }); setIsAddDialogOpen(false);
  };

  const handleEditClick = (product: Product) => { if (product.source === 'llm') return; setEditingProductId(product.id); setEditFormData({ name: product.name, category: product.category || '' }); setEditingHsCodeProductId(null); };
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { const { name, value } = e.target; setEditFormData(prev => ({ ...prev, [name]: value })); };
  const handleCancelEdit = () => { setEditingProductId(null); setEditFormData({ name: '', category: '' }); };
  const handleUpdateProduct = async (productId: string) => {
    if (!state.assessmentId) return;
    const original = productsList.find(p => p.id === productId); if (!original) return;
    const payload: any = {};
    if (editFormData.name.trim() && editFormData.name.trim() !== original.name) payload.name = editFormData.name.trim();
    if (editFormData.category.trim() !== (original.category || '')) payload.category = editFormData.category.trim() || undefined;
    if (!Object.keys(payload).length) { handleCancelEdit(); return; }
    const res = await fetch(`/api/assessment/${state.assessmentId}/products/${productId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json(); dispatch({ type: 'UPDATE_PRODUCT_STATE', payload: data }); handleCancelEdit(); };
  const handleEditInputBlur = () => { if (editingProductId) setTimeout(() => editingProductId && handleUpdateProduct(editingProductId), 100); };
  const handleEditInputKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && editingProductId) handleUpdateProduct(editingProductId); if (e.key === 'Escape') handleCancelEdit(); };
  const handleSoftDeleteProduct = async (id: string) => { if (!state.assessmentId) return; if (!confirm('Remove product?')) return; const res = await fetch(`/api/assessment/${state.assessmentId}/products/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_hidden: true }) }); const data = await res.json(); dispatch({ type: 'UPDATE_PRODUCT_STATE', payload: data }); };

  const handleGroupEditHsCode = (groupId: string) => {
    setEditingGroupId(groupId);
    setTempGroupHsCode(getGroupConfirmedCode(groupId) || '');
  };

  const handleGroupSaveHsCode = (groupId: string) => {
    products.filter(p => p.group_id === groupId || p.id === groupId).forEach(p =>
      dispatch({ type: 'UPDATE_PRODUCT_HS_CODE', payload: { productId: p.id, hsCode: tempGroupHsCode } })
    );
    setEditingGroupId(null);
    setTempGroupHsCode('');
  };

  const handleGroupCancelEdit = () => {
    setEditingGroupId(null);
    setTempGroupHsCode('');
  };

  return (
    <div className="p-4 border rounded bg-background h-full flex flex-col space-y-6">
      <div className="flex items-start space-x-4 p-4 bg-muted/50 rounded-lg">
        <SarahAvatarAbstract size="md" state="idle" />
        <p className="flex-1 text-sm">
          Alright {fullName || 'User'}, review and confirm HS Codes for each product.
        </p>
      </div>
      <div className="flex-grow overflow-y-auto space-y-4">
        <Card>
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle>Products & HS Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="space-y-2">
              {groupedProducts.map(group => (
                <AccordionItem key={group.parent.id} value={group.parent.id}>
                  <div className="flex justify-between w-full items-center">
                    <AccordionTrigger className="flex items-center flex-1 space-x-2">
                      <span className="font-medium">
                        {group.parent.name}
                        {getGroupClassificationConfidence(group.parent.id) < 90 && (
                          <span className="ml-1 text-yellow-600">⚠️</span>
                        )}
                      </span>
                      <Badge variant={getGroupClassificationConfidence(group.parent.id) < 90 ? 'destructive' : 'default'}>
                        {`${getGroupClassificationConfidence(group.parent.id)}%`}
                      </Badge>
                      <Badge variant={getGroupConfidence(group.parent.id) < 90 ? 'destructive' : 'default'}>
                        {`${getGroupConfidence(group.parent.id)}%`}
                        {getGroupConfidence(group.parent.id) < 90 && ' ⚠️'}
                      </Badge>
                    </AccordionTrigger>
                    <div className="flex items-center space-x-2">
                      {editingGroupId === group.parent.id ? (
                        <div className="flex space-x-2">
                          <Input
                            value={tempGroupHsCode}
                            onChange={e => setTempGroupHsCode(e.target.value)}
                            placeholder="HS Code"
                            className="w-24"
                          />
                          <Button size="sm" onClick={() => handleGroupSaveHsCode(group.parent.id)}><Check /></Button>
                          <Button size="sm" variant="ghost" onClick={handleGroupCancelEdit}><X /></Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => handleGroupEditHsCode(group.parent.id)}>
                          {getGroupConfirmedCode(group.parent.id) || 'Assign HS Code'}
                        </Button>
                      )}
                    </div>
                  </div>
                  <AccordionContent>
                    <div className="space-y-2">
                      {[group.parent, ...group.variants].map(prod => (
                        <div key={prod.id} className="flex justify-between items-center p-2 border rounded">
                          <div>
                            <p className="font-semibold">{prod.name}</p>
                            <div className="flex space-x-2 text-sm">
                              <Badge variant="outline">{prod.source}</Badge>
                              <Badge variant="secondary">{prod.confidence_score || 0}%</Badge>
                              <Badge variant="outline">
                                Taxo: {prod.classification_confidence ? `${Math.round(prod.classification_confidence * 100)}%` : '0%'}
                              </Badge>
                            </div>
                            {Array.isArray(prod.materials) && prod.materials.length > 0 && (
                              <div className="mt-1 flex flex-wrap space-x-1 text-xs">
                                {prod.materials.map((mat: string) => (
                                  <Badge key={mat} variant="secondary">{mat}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditClick(prod)}><Pencil /></Button>
                            <Button size="sm" variant="outline" onClick={() => handleSoftDeleteProduct(prod.id)}><Trash2 /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Step4_ProductConfirmation;
