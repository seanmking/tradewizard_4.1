"use client"

import React from 'react';
import { useAssessmentContext, Product } from '@/contexts/AssessmentContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from 'lucide-react'; 
import { Badge } from '@/components/ui/badge'; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'; 
import { Checkbox } from '@/components/ui/checkbox'; 
import { Check, Search, Edit, Pencil, X, Download, Plus, Trash2, Info } from 'lucide-react'; 
import SarahAvatarAbstract from '../src/components/ui/SarahAvatarAbstract'; // Use relative path
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription, 
    DialogFooter, 
    DialogTrigger,
    DialogClose
} from "@/components/ui/dialog"; // Import Dialog components
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Import Tooltip components
import { CheckedState } from '@radix-ui/react-checkbox'; // Import CheckedState type

const Step1_Welcome = () => {
  const { state, dispatch, goToNextStep } = useAssessmentContext();
  const { fullName, roleInBusiness } = state;
  console.log('Rendering Step 1 - Welcome. Current State:', state);

  const handleInputChange = (field: keyof typeof state, value: string) => {
    dispatch({ type: 'UPDATE_FIELD', payload: { field, value } });
  };

  const isStepComplete = !!fullName && !!roleInBusiness;

  return (
    <div className="p-4 border rounded bg-background h-full flex flex-col space-y-6">
      {/* Sarah's Introduction Area */}
      <div className="flex items-start space-x-4 p-4 bg-muted/50 rounded-lg">
        <SarahAvatarAbstract size="sm" state="idle" />
        <div className="flex-1 pt-1">
          <p className="text-sm text-foreground">
            Hi there! I'm Sarah, your AI guide for export readiness. To get started, could you tell me a bit about yourself?
          </p>
        </div>
      </div>

      {/* User Input Area */}
      <div className="flex-grow space-y-4">
         <div>
            <Label htmlFor="fullName">Your Full Name</Label>
            <Input 
                id="fullName" 
                placeholder="e.g., Jane Doe"
                value={fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
            />
         </div>
         <div>
             <Label htmlFor="roleInBusiness">Your Role in the Business</Label>
             <Select 
                value={roleInBusiness}
                onValueChange={(value: string) => handleInputChange('roleInBusiness', value)}
             >
                <SelectTrigger id="roleInBusiness">
                    <SelectValue placeholder="Select your role..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Owner">Owner / Founder</SelectItem>
                    <SelectItem value="Manager">Manager (Sales, Ops, etc.)</SelectItem>
                    <SelectItem value="Export Lead">Export Lead / Specialist</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
             </Select>
         </div>
      </div>

      {/* Navigation Area */}
      <div className="mt-auto flex justify-end pt-4 border-t">
        <Button onClick={goToNextStep} disabled={!isStepComplete}>
          Next: Your Online Presence
        </Button>
      </div>
    </div>
  );
};

const Step2_OnlinePresence = () => {
  const { state, dispatch, goToPreviousStep, triggerAnalysis } = useAssessmentContext();
  // Destructure relevant state for inputs
  const { websiteUrl, facebookUrl, instagramUrl, linkedinUrl, isLoading } = state;
  console.log('Rendering Step 2 - Online Presence. Current State:', state);

  const handleInputChange = (field: keyof typeof state, value: string) => {
    dispatch({ type: 'UPDATE_FIELD', payload: { field, value } });
  };

  const handleStartAnalysis = () => {
    // Basic validation: Ensure website URL is provided
    if (!websiteUrl) {
        // Optionally show an error message to the user
        alert('Please enter your main website URL to proceed.');
        return;
    }
    triggerAnalysis(); 
  }

  // Check if mandatory field (websiteUrl) is filled for enabling Next
  const isStepReadyForAnalysis = !!websiteUrl;

  return (
    <div className="p-4 border rounded bg-background h-full flex flex-col space-y-6">
       {/* Sarah's Dialogue Area */}
      <div className="flex items-start space-x-4 p-4 bg-muted/50 rounded-lg">
        {/* Use the animated avatar */}
        <SarahAvatarAbstract size="sm" state="idle" />
        <div className="flex-1 pt-1">
          <p className="text-sm text-foreground">
            Great, {state.fullName || 'nice to meet you'}! Now, please provide your company's main website URL. You can also add social media links and upload relevant documents like product catalogs or company profiles if you have them handy – this helps me build a more complete picture.
          </p>
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-grow space-y-4 overflow-y-auto pr-2">
        {/* Website URL (Required) */}
        <div>
            <Label htmlFor="websiteUrl">Website URL <span className="text-red-500">*</span></Label>
            <Input 
                id="websiteUrl" 
                type="url"
                placeholder="https://yourcompany.com"
                value={websiteUrl || ''} // Handle null case for value prop
                onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                required
            />
        </div>

        {/* Social Media Links (Optional) */}
        <div className="space-y-2 pt-2">
             <Label className="text-sm font-medium">Social Media (Optional)</Label>
             <Input 
                id="facebookUrl" 
                placeholder="Facebook URL (e.g., https://facebook.com/yourcompany)"
                value={facebookUrl || ''}
                onChange={(e) => handleInputChange('facebookUrl', e.target.value)}
             />
             <Input 
                id="instagramUrl" 
                placeholder="Instagram URL (e.g., https://instagram.com/yourcompany)"
                value={instagramUrl || ''}
                onChange={(e) => handleInputChange('instagramUrl', e.target.value)}
             />
              <Input 
                id="linkedinUrl" 
                placeholder="LinkedIn URL (e.g., https://linkedin.com/company/yourcompany)"
                value={linkedinUrl || ''}
                onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
             />
        </div>

        {/* File Uploads (Placeholders) */}
        <div className="space-y-2 pt-2">
            <Label className="text-sm font-medium">Upload Documents (Optional)</Label>
            <p className="text-xs text-muted-foreground">Upload functionality will be added later. Provide links if available online.</p>
            {/* Replace with actual upload components later (Task 3.12) */}
            <Button variant="outline" size="sm" disabled>Upload Product PDF</Button>
            <Button variant="outline" size="sm" disabled className="ml-2">Upload Company Profile</Button>
        </div>

      </div>

      {/* Navigation Area */}
      <div className="mt-auto flex justify-between pt-4 border-t">
         <Button variant="outline" onClick={goToPreviousStep} disabled={isLoading}>
            Previous
         </Button>
         <Button onClick={handleStartAnalysis} disabled={isLoading || !isStepReadyForAnalysis}> 
            {isLoading ? 'Starting Analysis...' : 'Next: Analyze Business'}
         </Button>
      </div>
    </div>
  );
};

const Step3_AnalysisInProgress = () => {
  const { state, dispatch } = useAssessmentContext(); // Added dispatch
  const { 
    assessmentId, 
    assessmentStatus, 
    exportVisionOptions, 
    exportVisionOtherText 
  } = state; // Get current exportVision or default to empty string
  console.log('Rendering Step 3 - Analysis In Progress. Current State:', state);

  const handleCheckboxChange = (checked: CheckedState, option: string) => {
    // We only care about the boolean state for toggling
    if (typeof checked === 'boolean') { 
      dispatch({ type: 'TOGGLE_EXPORT_VISION_OPTION', payload: option });
    }
    // Handle 'Other' interaction if necessary - now handled by separate textarea
    // dispatch({ type: 'UPDATE_EXPORT_VISION', payload: value });
  };

  const handleOtherTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({ type: 'UPDATE_EXPORT_VISION_TEXT', payload: e.target.value });
  };

  return (
    <div className="p-4 border rounded bg-background h-full flex flex-col space-y-6">
      {/* Top Section: Analysis Indicator */}
      <div className="flex flex-col items-center justify-center space-y-4 p-4 text-center">
        <SarahAvatarAbstract size="lg" state="processing" />
        <p className="text-lg font-medium text-foreground">
          Got it! I'm now analyzing the information you provided...
        </p>
        <p className="text-sm text-muted-foreground">
          This might take a minute or two. Please wait while I gather insights about your business.
        </p>
        <div className="flex items-center justify-center space-x-2 pt-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-muted-foreground text-sm">Analyzing...</span>
        </div>
      </div>

      {/* Middle Section: Export Vision Prompt */}
      <div className="flex-grow overflow-y-auto px-4 space-y-4 border-t pt-4">
        <div className="flex items-start space-x-3 p-3 bg-muted/30 rounded-md border">
          <SarahAvatarAbstract size="sm" state="idle" /> 
          <div className="flex-1 space-y-3">
            <p className="text-sm font-medium text-foreground">
              While I’m working, can I ask — why do you want to export?
            </p>
            <div className="space-y-2"> {/* Container for checkboxes */} 
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="vision-revenue" 
                  checked={exportVisionOptions.includes('Increase Revenue')}
                  onCheckedChange={(checked) => handleCheckboxChange(checked, 'Increase Revenue')}
                />
                <Label htmlFor="vision-revenue" className="font-normal">Increase Revenue</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="vision-brand" 
                  checked={exportVisionOptions.includes('Build Brand')}
                  onCheckedChange={(checked) => handleCheckboxChange(checked, 'Build Brand')}
                />
                <Label htmlFor="vision-brand" className="font-normal">Build Brand</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="vision-markets" 
                  checked={exportVisionOptions.includes('Access New Markets')}
                  onCheckedChange={(checked) => handleCheckboxChange(checked, 'Access New Markets')}
                />
                <Label htmlFor="vision-markets" className="font-normal">Access New Markets</Label>
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="vision-other-text" className="font-normal block mb-1 text-sm">Other reason(s):</Label>
              <Textarea
                id="vision-other-text"
                placeholder="Please specify your reason..."
                value={exportVisionOtherText}
                onChange={handleOtherTextChange}
                className="mt-2"
                rows={3}
              />
            </div>
          </div>
        </div>
      </div>

      {/* No navigation buttons needed here, handled by context polling logic */}
    </div>
  );
};

const Step4_ProductConfirmation = () => {
  const { state, dispatch, goToNextStep, goToPreviousStep } = useAssessmentContext();
  const { products, isLoading, fullName } = state;
  // Add local state for managing which HS code is being edited
  const [editingHsCodeProductId, setEditingHsCodeProductId] = React.useState<string | null>(null);
  const [tempHsCode, setTempHsCode] = React.useState<string>("");
  // State for Add Product Dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [newProductData, setNewProductData] = React.useState({ name: '', category: '' });
  // State for Edit Product Dialog
  const [editingProductId, setEditingProductId] = React.useState<string | null>(null);
  const [editFormData, setEditFormData] = React.useState({ name: '', category: '' });


  console.log('Rendering Step 4 - Product Confirmation. Current State:', state);

  // Filter products to display (exclude hidden)
  const productsList = state.products.filter(p => !p.user_hidden);
  const hasProducts = productsList && productsList.length > 0;

  // Handlers for HS Code actions
  const handleConfirmHsCode = (productId: string, estimatedCode: string) => {
    dispatch({ type: 'UPDATE_PRODUCT_HS_CODE', payload: { productId, hsCode: estimatedCode } });
  };

  const handleFindHsCode = (productId: string) => {
    // Mock lookup - replace with actual logic later
    const mockHsCode = prompt("Mock HS Code Lookup: Enter a code for this product (e.g., 1234.56)", "1234.56");
    if (mockHsCode) { // Proceed only if user entered something
        dispatch({ type: 'UPDATE_PRODUCT_HS_CODE', payload: { productId, hsCode: mockHsCode } });
    }
  };

  const handleEditHsCode = (product: Product) => {
    setEditingHsCodeProductId(product.id);
    setTempHsCode(product.confirmed_hs_code || product.estimated_hs_code || "");
  };

  const handleSaveHsCode = (productId: string) => {
    dispatch({ type: 'UPDATE_PRODUCT_HS_CODE', payload: { productId, hsCode: tempHsCode } });
    setEditingHsCodeProductId(null);
    setTempHsCode("");
  };

  const handleCancelEditHsCode = () => {
    setEditingHsCodeProductId(null);
    setTempHsCode("");
  };

  // Handler for saving new product
  const handleSaveNewProduct = async () => {
    if (!newProductData.name.trim()) {
        alert("Product name cannot be empty.");
        return;
    }

    if (!state.assessmentId) {
        console.error("Assessment ID is missing from context state.");
        alert("Error: Cannot save product without a valid assessment ID.");
        return;
    }

    const apiEndpoint = `/api/assessment/${state.assessmentId}/products`;
    const payload = {
        name: newProductData.name,
        category: newProductData.category || undefined, // Set category or undefined if empty
        // Add description here if that field is added to the dialog
    };

    // Optional: Add loading state here
    console.log(`Calling POST ${apiEndpoint} with payload:`, payload);

    try {
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const responseData = await response.json(); // Attempt to parse JSON regardless of status

        if (!response.ok) {
            console.error('API Error Response:', responseData);
            throw new Error(responseData.message || `API Error: ${response.status} ${response.statusText}`);
        }

        console.log('API Success Response:', responseData);
        // Dispatch action with the product data returned from the API
        dispatch({ 
            type: 'ADD_PRODUCT_STATE', 
            payload: responseData // responseData should match the Product interface
        });

        // Reset form and close dialog on success
        setNewProductData({ name: '', category: '' });
        setIsAddDialogOpen(false);

    } catch (error: any) {
        console.error('Failed to save new product:', error);
        alert(`Error saving product: ${error.message}`);
        // Optional: Handle specific errors or update UI
    } finally {
        // Optional: Stop loading state here
    }
  };

  // --- Inline Editing Handlers ---

  const handleEditClick = (product: Product) => {
    if (product.source === 'llm') return; // Don't allow editing AI-sourced products directly yet
    setEditingProductId(product.id);
    setEditFormData({ name: product.name, category: product.category || '' });
    setEditingHsCodeProductId(null); // Close HS code editing if open
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCancelEdit = () => {
      setEditingProductId(null);
      setEditFormData({ name: '', category: '' });
  }

  // Call API to save changes
  const handleUpdateProduct = async (productId: string) => {
    if (!state.assessmentId) {
      console.error("Assessment ID missing");
      alert("Error: Cannot update product without Assessment ID.");
      handleCancelEdit();
      return;
    }

    const trimmedName = editFormData.name.trim();
    if (!trimmedName) {
        alert("Product name cannot be empty.");
        // Optionally revert input visually or keep focus
        return;
    }

    const originalProduct = productsList.find(p => p.id === productId);
    if (!originalProduct) return; // Should not happen

    const payload: { name?: string; category?: string } = {};
    if (trimmedName !== originalProduct.name) {
      payload.name = trimmedName;
    }
    const trimmedCategory = editFormData.category?.trim();
    if (trimmedCategory !== (originalProduct.category || '')) { // Compare with original, considering undefined/empty string
      payload.category = trimmedCategory || undefined; // Send undefined if cleared
    }

    // If no changes, just exit edit mode
    if (Object.keys(payload).length === 0) {
        handleCancelEdit();
        return;
    }

    const apiEndpoint = `/api/assessment/${state.assessmentId}/products/${productId}`;
    // TODO: Show Saving... toast/indicator
    console.log(`Calling PATCH ${apiEndpoint} with payload:`, payload);

    try {
      const response = await fetch(apiEndpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('API Error Response:', responseData);
        throw new Error(responseData.message || `API Error: ${response.status} ${response.statusText}`);
      }

      console.log('API Success Response:', responseData);
      // Dispatch update to context state
      dispatch({ type: 'UPDATE_PRODUCT_STATE', payload: responseData }); 
      // TODO: Show Updated! toast/indicator
      handleCancelEdit(); // Exit edit mode on success

    } catch (error: any) {
      console.error('Failed to update product:', error);
      alert(`Error updating product: ${error.message}`);
      // TODO: Handle specific errors or update UI
      // Decide if we keep edit mode open or cancel
      // For now, cancel edit mode
      handleCancelEdit(); 
    } finally {
      // TODO: Hide Saving... toast/indicator
    }
  };

  // Trigger save on Blur or Enter key
  const handleEditInputBlur = () => {
    // Small delay to allow potential 'Cancel' button click
    setTimeout(() => {
        if (editingProductId) { // Check if still in edit mode (might have been cancelled)
             handleUpdateProduct(editingProductId);
        }
    }, 100);
  };

  const handleEditInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission if input is inside a form
      if(editingProductId) handleUpdateProduct(editingProductId);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // --- End Inline Editing Handlers ---


  // --- Soft Delete Handler ---
  const handleSoftDeleteProduct = async (productId: string, productName: string) => {
    if (!state.assessmentId) {
      console.error("Assessment ID missing");
      alert("Error: Cannot remove product without Assessment ID.");
      return;
    }

    // Confirmation Dialog
    const confirmed = window.confirm(`Are you sure you want to remove the product "${productName}"? It can be managed later if needed.`);
    if (!confirmed) {
      return;
    }

    const apiEndpoint = `/api/assessment/${state.assessmentId}/products/${productId}`;
    const payload = { user_hidden: true };

    // TODO: Show Removing... toast/indicator
    console.log(`Calling PATCH ${apiEndpoint} with payload:`, payload);

    try {
      const response = await fetch(apiEndpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('API Error Response:', responseData);
        throw new Error(responseData.message || `API Error: ${response.status} ${response.statusText}`);
      }

      console.log('API Success Response (Soft Delete):', responseData);
      // Dispatch update to context state - this will update the user_hidden flag
      dispatch({ type: 'UPDATE_PRODUCT_STATE', payload: responseData }); 
      // TODO: Show Removed! toast/indicator (with potential undo)
      // The product will disappear from the list because the table filters !p.user_hidden

    } catch (error: any) {
      console.error('Failed to remove product:', error);
      alert(`Error removing product: ${error.message}`);
      // TODO: Show error toast
    } finally {
       // TODO: Hide Removing... toast/indicator
    }

  }

  // --- End Soft Delete Handler ---


  return (
    <div className="p-4 border rounded bg-background h-full flex flex-col space-y-6">
       {/* Sarah's Dialogue Area */}
       <div className="flex items-start space-x-4 p-4 bg-muted/50 rounded-lg">
          <SarahAvatarAbstract size="md" state="idle" />
          <div className="flex-1 pt-1">
            <p className="text-sm text-foreground">
                Alright {fullName || 'User'}, here are the products I identified. Please review them and confirm or provide the correct HS Code for each. This is crucial for customs classification.
            </p>
          </div>
       </div>

       {/* Product Display Area */}
       <div className="flex-grow space-y-4 overflow-y-auto pr-2">
           <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                 <div>
                    <CardTitle>Identified Products & HS Codes</CardTitle>
                    <CardDescription>Review products and confirm/edit HS Codes.</CardDescription>
                 </div>
                 {/* Add Product Button with Dialog */}
                 <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Plus className="mr-2 h-4 w-4" /> Add Product
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New Product</DialogTitle>
                            <DialogDescription>
                                Enter the details for the new product you want to add to the assessment.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                Name
                                </Label>
                                <Input 
                                    id="name" 
                                    value={newProductData.name} 
                                    onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })} 
                                    className="col-span-3" 
                                    placeholder="e.g. Organic Honey"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="category" className="text-right">
                                Category
                                </Label>
                                <Input 
                                    id="category" 
                                    value={newProductData.category} 
                                    onChange={(e) => setNewProductData({ ...newProductData, category: e.target.value })} 
                                    className="col-span-3" 
                                    placeholder="(Optional) e.g. Food & Beverage"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isLoading || !newProductData.name.trim()}>Add Product</Button>
                        </DialogFooter>
                    </DialogContent>
                 </Dialog>
              </CardHeader>
              <CardContent>
                 {hasProducts ? (
                    <Table>
                       <TableHeader>
                          <TableRow>
                             <TableHead className="w-[40%]">Product Name</TableHead>
                             <TableHead className="w-[25%]">Category</TableHead>
                             <TableHead className="w-[35%]">HS Code</TableHead>
                             {/* Removed Actions column for now, integrating into HS Code */}
                          </TableRow>
                       </TableHeader>
                       <TableBody>
                          {productsList.map((product) => (
                             <TableRow key={product.id}>
                                <TableCell className="w-[250px]">
                                  {editingProductId === product.id ? (
                                    <Input
                                      type="text"
                                      name="name"
                                      value={editFormData.name}
                                      onChange={handleEditInputChange}
                                      onBlur={handleEditInputBlur}
                                      onKeyDown={handleEditInputKeyDown}
                                      autoFocus
                                      className="h-8" 
                                    />
                                  ) : (
                                    product.name
                                  )}
                                </TableCell>
                                <TableCell className="w-[180px]">
                                  {editingProductId === product.id ? (
                                    <Input
                                      type="text"
                                      name="category"
                                      value={editFormData.category}
                                      onChange={handleEditInputChange}
                                      onBlur={handleEditInputBlur}
                                      onKeyDown={handleEditInputKeyDown}
                                      placeholder="(Optional)"
                                      className="h-8"
                                    />
                                  ) : (
                                    product.category || <span className="text-muted-foreground">N/A</span>
                                  )}
                                </TableCell>
                                <TableCell className="w-[150px]">
                                  {editingHsCodeProductId === product.id ? (
                                    // Edit Mode
                                    <div className="flex items-center space-x-1">
                                      <Input 
                                        type="text" 
                                        value={tempHsCode} 
                                        onChange={(e) => setTempHsCode(e.target.value)} 
                                        className="h-8 text-xs p-1"
                                        placeholder="e.g. 1234.56"
                                      />
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSaveHsCode(product.id)}><Check className="h-4 w-4" /></Button>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancelEditHsCode}><X className="h-4 w-4" /></Button> 
                                    </div>
                                  ) : product.confirmed_hs_code ? (
                                    // Display Confirmed Code with Edit Button
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-mono mr-2">{product.confirmed_hs_code}</span>
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditHsCode(product)}>
                                          <Pencil className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : product.estimated_hs_code ? (
                                    // Display Estimated Code with Confirm Button
                                    <div className="flex items-center space-x-1">
                                      <span className="text-sm font-mono text-muted-foreground mr-1">{product.estimated_hs_code}</span>
                                      <Button variant="outline" size="sm" onClick={() => handleConfirmHsCode(product.id, product.estimated_hs_code!)} className="h-7">
                                          <Check className="h-3 w-3 mr-1" /> Confirm
                                      </Button>
                                       <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditHsCode(product)}>
                                          <Pencil className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    // Display Find Button
                                      <Button variant="outline" size="sm" onClick={() => handleFindHsCode(product.id)} className="h-7">
                                         <Search className="h-3 w-3 mr-1" /> Find Code
                                      </Button>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end space-x-1">
                                      {/* Edit Name/Category Button - Only if not AI sourced */}
                                      {product.source !== 'llm' && editingProductId !== product.id && (
                                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(product)} title="Edit Name/Category">
                                              <Pencil className="h-4 w-4" />
                                          </Button>
                                      )}
                                      {/* Cancel Edit Button */}
                                      {editingProductId === product.id && (
                                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancelEdit} title="Cancel Edit">
                                            <X className="h-4 w-4" />
                                        </Button>
                                      )}
                                      {/* Find HS Code Button */}
                                      {!product.confirmed_hs_code && editingHsCodeProductId !== product.id && (
                                          <Button variant="outline" size="sm" className="h-8"> 
                                              <Search className="mr-1 h-4 w-4" /> Find
                                          </Button>
                                      )}
                                      {/* Soft Delete Button - Only if not AI sourced and not editing */}
                                      {product.source !== 'llm' && editingProductId !== product.id && (
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" 
                                            onClick={() => handleSoftDeleteProduct(product.id, product.name)}
                                            title="Remove Product"
                                          >
                                              <Trash2 className="h-4 w-4" />
                                          </Button>
                                      )}
                                  </div>
                                </TableCell>
                                <TableCell className="w-[80px]">
                                  <Badge variant={product.source === 'llm' ? "secondary" : "outline"}>
                                    {product.source === 'llm' ? 'AI' : 'Manual'}
                                  </Badge>
                                </TableCell>
                             </TableRow>
                          ))}
                       </TableBody>
                    </Table>
                 ) : (
                    <p className="text-sm text-muted-foreground pt-4">No products were identified yet.</p>
                 )}
              </CardContent>
           </Card>
       </div>

       {/* Navigation Area */}
       <div className="mt-auto flex justify-between pt-4 border-t">
           <Button variant="outline" onClick={goToPreviousStep} disabled={isLoading}>
               Previous
           </Button>
           {/* Might disable Next if no products? Or allow proceeding? For now, allow. */}
           <Button onClick={goToNextStep} disabled={isLoading || !hasProducts}> 
              {isLoading ? 'Loading...' : 'Next: Select Target Markets'}
           </Button>
       </div>
    </div>
  );
};

const Step5_MarketSelect = () => {
  const { state, dispatch, goToNextStep, goToPreviousStep } = useAssessmentContext(); // Add goToNextStep and goToPreviousStep
  const { selectedMarkets = [], isLoading } = state; // Add isLoading
  const maxMarkets = 3;

  // Mock market options - Replace with dynamic data later
  const marketOptions = [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'JP', name: 'Japan' },
    { code: 'AU', name: 'Australia' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'SG', name: 'Singapore' },
    { code: 'ZA', name: 'South Africa' },
  ];

  const handleMarketChange = (marketCode: string) => {
    const isSelected = selectedMarkets.includes(marketCode);
    if (!isSelected && selectedMarkets.length >= maxMarkets) {
      // Prevent selecting more than maxMarkets
       console.log("Maximum markets selected. Cannot add more.");
       // Optionally show a toast notification here
      return;
    }
    dispatch({ type: 'TOGGLE_MARKET', payload: marketCode });
  };

  const selectionCount = selectedMarkets.length;
  const marketsLeft = maxMarkets - selectionCount;

  // Sarah's prompts based on selection
  let sarahPrompt = "Which markets are you targeting? Choose up to 3.";
  if (selectionCount === 1) {
    sarahPrompt = `Great start! ${marketsLeft} more markets possible.`;
  } else if (selectionCount === 2) {
    sarahPrompt = `Excellent choices. ${marketsLeft} more market slot available.`;
  } else if (selectionCount === maxMarkets) {
    sarahPrompt = `Perfect, you've selected the maximum of ${maxMarkets} markets! Ready for the next step?`;
  }

  console.log('Rendering Step 5 - Market Select. Current State:', state);

  return (
    <div className="p-4 border rounded bg-background h-full flex flex-col space-y-6">
       {/* Sarah's Dialogue Area */}
      <div className="p-4 bg-secondary/30 rounded-lg border border-input flex items-start space-x-3">
        <img src="/sarah.png" alt="Sarah Avatar" className="w-12 h-12 rounded-full border-2 border-primary" />
        <div className="flex-1">
            <p className="font-semibold text-primary">Sarah:</p>
            <p className="text-sm text-foreground/90 mt-1">{sarahPrompt}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
         <h3 className="text-lg font-semibold">Select Target Export Markets</h3>
         <p className="text-sm text-muted-foreground">You have selected {selectionCount} of {maxMarkets} markets.</p>
         <TooltipProvider delayDuration={100}>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                 {marketOptions.map((market) => {
                     const isSelected = selectedMarkets.includes(market.code);
                     const isDisabled = !isSelected && selectionCount >= maxMarkets;
                     const CheckboxComponent = (
                         <div key={market.code} className={`flex items-center space-x-2 p-3 border rounded-md transition-colors ${isDisabled ? 'opacity-50 cursor-not-allowed bg-muted/50' : 'hover:bg-muted/50'}`}> 
                             <Checkbox
                                 id={market.code}
                                 checked={isSelected}
                                 onCheckedChange={() => handleMarketChange(market.code)}
                                 disabled={isDisabled}
                                 aria-label={`Select ${market.name}`}
                             />
                             <label
                                 htmlFor={market.code}
                                 className={`text-sm font-medium leading-none ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                             >
                                 {market.name}
                             </label>
                         </div>
                     );

                     if (isDisabled) {
                         return (
                             <Tooltip key={`${market.code}-tooltip`}>
                                 <TooltipTrigger asChild>
                                     {/* Need a div wrapper for TooltipTrigger when child is disabled */} 
                                     <div className="cursor-not-allowed">{CheckboxComponent}</div>
                                 </TooltipTrigger>
                                 <TooltipContent>
                                     <p>Max {maxMarkets} markets selected. Unselect one to choose another.</p>
                                 </TooltipContent>
                             </Tooltip>
                         );
                     } else {
                         return CheckboxComponent;
                     }
                 })}
             </div>
         </TooltipProvider>
      </div>

      {/* Navigation Area */}
      <div className="mt-auto flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={goToPreviousStep} disabled={isLoading}>
              Previous
          </Button>
          <Button onClick={goToNextStep} disabled={isLoading || selectedMarkets.length === 0}> 
              {isLoading ? 'Loading...' : 'Next: Review Summary'}
          </Button>
      </div>

    </div>
  );
}

const Step6_ReviewFindings = () => {
  const { state, goToNextStep, goToPreviousStep } = useAssessmentContext();
  const { companySummary, certifications, isLoading, fullName } = state;
  console.log('Rendering Step 6 - Review Findings. Current State:', state);

  // Basic check if data is loaded (adjust if needed based on actual loading state)
  const isDataLoaded = !!companySummary || (certifications && certifications.length > 0);

  return (
    <div className="p-4 border rounded bg-background h-full flex flex-col space-y-6">
       {/* Sarah's Dialogue Area */}
       <div className="flex items-start space-x-4 p-4 bg-muted/50 rounded-lg">
          <SarahAvatarAbstract size="md" state="idle" />
          <div className="flex-1 pt-1">
            <p className="text-sm text-foreground">
                Okay {fullName || 'User'}, we've reviewed the products and markets. Please review the company summary and potential certifications I found. This is the last review step before the final summary.
            </p>
          </div>
       </div>

       {/* Findings Display Area */}
       <div className="flex-grow space-y-4 overflow-y-auto pr-2">
           {/* Company Summary Card */}
           <Card>
              <CardHeader>
                 <CardTitle>Company Summary</CardTitle>
                 <CardDescription>A brief overview generated from the provided information.</CardDescription>
              </CardHeader>
              <CardContent>
                 {companySummary ? (
                    <p className="text-sm">{companySummary}</p>
                 ) : (
                    <p className="text-sm text-muted-foreground">No company summary was generated.</p>
                 )}
              </CardContent>
           </Card>

            {/* Certifications Card */}
           <Card>
              <CardHeader>
                 <CardTitle>Potential Certifications</CardTitle>
                 <CardDescription>Certifications that might be relevant based on the analysis.</CardDescription>
              </CardHeader>
              <CardContent>
                 {certifications && certifications.length > 0 ? (
                    <ul className="space-y-2">
                       {certifications.map((cert, index) => (
                          <li key={index} className="text-sm flex items-center justify-between">
                             <span>{cert.name}</span>
                             {cert.required_for && cert.required_for.length > 0 && (
                                <div className="flex space-x-1">
                                   {cert.required_for.map((country: string) => (
                                       <Badge key={country} variant="secondary">{country}</Badge>
                                   ))}
                                </div>
                             )}
                          </li>
                       ))}
                    </ul>
                 ) : (
                    <p className="text-sm text-muted-foreground">No specific certifications were identified.</p>
                 )}
              </CardContent>
           </Card>
       </div>

       {/* Navigation Area */}
       <div className="mt-auto flex justify-between pt-4 border-t">
           <Button variant="outline" onClick={goToPreviousStep} disabled={isLoading}>
              Previous
           </Button>
           <Button onClick={goToNextStep} disabled={isLoading || !isDataLoaded}> 
              {isLoading ? 'Loading...' : 'Next: Final Summary'}
           </Button>
       </div>
    </div>
  );
};

const Step7_AssessmentSummary: React.FC = () => {
  const { state, dispatch, goToPreviousStep, finishAssessment } = useAssessmentContext(); // Get context state and actions
  const { 
      companyName,
      role, // Assuming 'role' exists in state, populated earlier
      websiteUrl, // Assuming 'websiteUrl' exists in state, populated earlier
      socialLinks, // Assuming 'socialLinks' might exist (e.g., from LLM)
      products: allProducts = [], 
      selectedMarkets = [],
      certifications, // Assuming 'certifications' might exist (e.g., from LLM)
      isLoading, // Destructure isLoading from state
      error // Also get error from state if needed for UI
   } = state;

  console.log('Rendering Step 7 - Assessment Summary. Current State:', state);

  // Filter products to show only confirmed (not hidden)
  const confirmedProducts = allProducts.filter(p => !p.user_hidden);

  // Helper to display social links safely
  const renderSocialLinks = () => {
    if (!socialLinks || typeof socialLinks !== 'object' || Object.keys(socialLinks).length === 0) {
      return <p className="text-sm text-muted-foreground">Not provided</p>;
    }
    // Ensure we only render valid links and handle potential null values
    const validLinks = Object.entries(socialLinks)
      .filter(([_, link]) => link)
      .map(([platform, link]) => (
        <li key={platform} className="text-sm">
          <span className="font-medium capitalize">{platform}: </span>
          <a href={link as string} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
            {link as string}
          </a>
        </li>
      ));

    return (
      <ul className="list-none space-y-1">
        {validLinks.length > 0 ? validLinks : <p className="text-sm text-muted-foreground">No valid links provided</p>}
      </ul>
    );
  };

   // Helper to display certifications safely
  const renderCertifications = () => {
    if (!Array.isArray(certifications) || certifications.length === 0) {
      return <p className="text-sm text-muted-foreground">None specified yet</p>;
    }
    
    const validCertifications = certifications.map((cert, index: number) => (
        <li key={index} className="text-sm">
          <span className="font-medium">{cert.name}</span>
          {Array.isArray(cert.required_for) && cert.required_for.length > 0 && (
            <span className="text-muted-foreground text-xs"> (Required for: {cert.required_for.join(', ')})</span>
          )}
        </li>
      ));

    return (
      <ul className="list-disc space-y-1 pl-5">
         {validCertifications}
      </ul>
    );
  };

  return (
    <div className="p-4 border rounded bg-background h-full flex flex-col space-y-6">
      {/* Sarah's Dialogue Area */}
      <div className="p-4 bg-secondary/30 rounded-lg border border-input flex items-start space-x-3">
        <img src="/sarah.png" alt="Sarah Avatar" className="w-12 h-12 rounded-full border-2 border-primary" />
        <div className="flex-1">
          <p className="font-semibold text-primary">Sarah:</p>
          <p className="text-sm text-foreground/90 mt-1">
            🎉 You’ve completed your Export Readiness Snapshot! Here's a summary of what we've gathered. This is a strong start. Let's keep building!
          </p>
        </div>
      </div>

      {/* Summary Content Area */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Company & Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm"><span className="font-medium">Company Name:</span> {companyName || <span className='text-muted-foreground'>Not specified</span>}</p>
            <p className="text-sm"><span className="font-medium">Your Role:</span> {role || <span className='text-muted-foreground'>Not specified</span>}</p>
            <p className="text-sm"><span className="font-medium">Website:</span> {websiteUrl ? <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{websiteUrl}</a> : <span className='text-muted-foreground'>Not specified</span>}</p>
             <div>
                <p className="text-sm font-medium mb-1">Social Links:</p>
                 {renderSocialLinks()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Confirmed Products ({confirmedProducts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {confirmedProducts.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5">
                {confirmedProducts.map((product) => (
                  <li key={product.id} className="text-sm">
                    <span className="font-medium">{product.name}</span>
                    {product.category && <span className="text-muted-foreground"> ({product.category})</span>}
                    <Badge variant={product.source === 'llm' ? "secondary" : "outline"} className="ml-2 scale-90">{product.source === 'llm' ? 'AI' : 'Manual'}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No products confirmed yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Target Markets</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedMarkets.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedMarkets.map((marketCode) => (
                  // Assuming we have a way to map code to name, or just show code
                  <Badge key={marketCode} variant="outline">{marketCode}</Badge> 
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No markets selected yet.</p>
            )}
          </CardContent>
        </Card>

         <Card>
          <CardHeader>
            <CardTitle className="text-lg">Potential Certifications</CardTitle>
             <CardDescription className="text-xs">Note: This list may be populated or refined based on AI analysis.</CardDescription>
          </CardHeader>
          <CardContent>
            {renderCertifications()}
          </CardContent>
        </Card>

      </div>

      {/* Action Area */} 
      <div className="mt-auto flex justify-between items-center pt-4 border-t">
        <Button variant="outline" onClick={goToPreviousStep} disabled={isLoading}>
          Previous
        </Button>
        <div className="flex items-center space-x-2">
             {/* Placeholder Download Button */}
            <Button variant="outline" disabled>
                <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
            <Button 
              onClick={finishAssessment} 
              disabled={isLoading} 
              className="ml-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finishing...
                </>
              ) : (
                'Finish Assessment'
              )}
            </Button>
        </div>
      </div>
    </div>
  );
};

const Step7_Summary = () => {
    const { state, goToPreviousStep } = useAssessmentContext();
    const { isLoading, fullName, targetMarkets, products } = state; 
    console.log('Rendering Step 7 - Summary. Current State:', state);

    // Calculate summary data
    const productCount = products?.length || 0;
    const confirmedHsCodeCount = products?.filter(p => !!p.confirmed_hs_code).length || 0;
    const markets = targetMarkets?.join(', ') || 'None Selected';

    return (
        <div className="p-4 border rounded bg-background h-full flex flex-col space-y-6">
            {/* Sarah's Dialogue Area */}
            <div className="flex items-start space-x-4 p-4 bg-muted/50 rounded-lg">
                <SarahAvatarAbstract size="md" state="idle" />
                <div className="flex-1 pt-1">
                    <p className="text-sm text-foreground">
                        We've reached the end of this initial assessment, {fullName || 'User'}! Here's a quick summary of what we've gathered. You can review it below. The export function will be available soon.
                    </p>
                </div>
            </div>

            {/* Summary Display Area */}
            <div className="flex-grow space-y-4 overflow-y-auto pr-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Assessment Summary</CardTitle>
                        <CardDescription>Overview of the gathered information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <p><strong>User:</strong> {fullName || 'Not Provided'}</p>
                        <p><strong>Identified Products:</strong> {productCount}</p>
                        <p><strong>Products with Confirmed HS Codes:</strong> {confirmedHsCodeCount} / {productCount}</p>
                        <p><strong>Selected Target Markets:</strong> {markets}</p>
                        {/* Add more summary points as needed e.g., Company Summary, Certs */} 
                        
                        {/* Placeholder for Export Button */}
                        <div className="pt-4 text-center">
                            <Button disabled> 
                                <Download className="mr-2 h-4 w-4" /> Export Report (Coming Soon)
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Navigation Area - Only Previous */}
            <div className="mt-auto flex justify-start pt-4 border-t"> {/* Changed justify-between to justify-start */} 
                <Button variant="outline" onClick={goToPreviousStep} disabled={isLoading}>
                    Previous
                </Button>
                {/* No Next Button */}
            </div>
        </div>
    );
}

export function WebsiteAnalysisCenter() {
  const { state } = useAssessmentContext();
  const { currentStep } = state;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1_Welcome />;
      case 2:
        return <Step2_OnlinePresence />;
      case 3: 
        return <Step3_AnalysisInProgress />;
      case 4:
        return <Step4_ProductConfirmation />;
      case 5:
        return <Step5_MarketSelect />;
      case 6:
        return <Step6_ReviewFindings />;
      case 7:
        return <Step7_AssessmentSummary />;
      default:
        console.error("Invalid step encountered:", currentStep);
        return <div>Error: Invalid Step</div>;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Sarah's Guided Assessment - Step {currentStep}</CardTitle>
        <CardDescription>
            Follow the steps to complete your export readiness assessment.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-4">
         <div className="flex-grow h-full">
           {renderStepContent()}
         </div>
      </CardContent>
    </Card>
  );
}
