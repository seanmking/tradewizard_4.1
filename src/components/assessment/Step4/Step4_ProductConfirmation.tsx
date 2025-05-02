import React from 'react';
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

/**
 * Step 4: Product Confirmation Panel
 * Extracted from WebsiteAnalysisCenter
 */
const Step4_ProductConfirmation: React.FC = () => {
  const { state, dispatch, goToNextStep, goToPreviousStep } = useAssessmentContext();
  const { products, isLoading, fullName } = state;

  const [editingHsCodeProductId, setEditingHsCodeProductId] = React.useState<string | null>(null);
  const [tempHsCode, setTempHsCode] = React.useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [newProductData, setNewProductData] = React.useState({ name: '', category: '' });
  const [editingProductId, setEditingProductId] = React.useState<string | null>(null);
  const [editFormData, setEditFormData] = React.useState({ name: '', category: '' });

  const productsList = products.filter(p => !p.user_hidden);
  const hasProducts = productsList.length > 0;

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
            <div>
              <CardTitle>Products & HS Codes</CardTitle>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default Step4_ProductConfirmation;
