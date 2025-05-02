"use client"

import React from 'react';
import { useAssessmentContext, Product } from '@/contexts/AssessmentContext';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Check, X, Pencil, Search, Trash2, Download } from 'lucide-react';
// If SarahAvatarAbstract is a custom component, import it from its expected location:
import SarahAvatarAbstract from '@/src/components/ui/SarahAvatarAbstract';

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
  };

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

import Step4_ProductConfirmation from '@/src/components/assessment/Step4/Step4_ProductConfirmation';

const Step5_MarketSelect: React.FC = () => <div>Step 5: Market Select (stub)</div>;

const Step6_ReviewFindings: React.FC = () => <div>Step 6: Review Findings (stub)</div>;

const Step7_AssessmentSummary: React.FC = () => <div>Step 7: Assessment Summary (stub)</div>;

const Step8_FinalSummary: React.FC = () => <div>Step 8: Final Summary (stub)</div>;

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
      case 8:
        return <Step8_FinalSummary />;
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
