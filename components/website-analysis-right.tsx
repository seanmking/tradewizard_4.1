"use client"

import React from 'react'
import { HelpCircle, FileText, ExternalLink, LightbulbIcon, LifeBuoy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from "@/components/ui/input"; // Use Input
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function WebsiteAnalysisRight() {
    return (
        <div className="flex flex-col space-y-5 md:space-y-6 h-full"> {/* Adjusted spacing */}
            {/* Title Removed */}

            {/* Ask Sarah Card */}
            <Card className="bg-muted/50 border border-muted shadow-sm rounded-xl">
                <CardHeader className="flex flex-row items-center gap-3 pb-2 transition-colors"> {/* Reduced pb */}
                    <LifeBuoy className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base font-semibold tracking-tight">Ask Sarah</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2"> {/* Reduced spacing */}
                     {/* Use Input instead of Textarea */}
                     <Input placeholder="Ask about compliance or this analysis..." />
                     <Button size="sm" className="w-full transition-colors hover:bg-primary/90">Send Question</Button>
                </CardContent>
            </Card>

            {/* Common Questions Card */}
             <Card className="bg-muted/50 border border-muted shadow-sm rounded-xl">
                <CardHeader className="flex flex-row items-center gap-3 pb-2 transition-colors"> {/* Reduced pb */}
                    <HelpCircle className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-base font-semibold tracking-tight">Common Questions</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-2"> {/* Adjusted padding */}
                     <Accordion type="single" collapsible className="w-full">
                        {/* Updated Questions */}
                        <AccordionItem value="q-dual-use">
                            <AccordionTrigger className="text-sm py-2 hover:no-underline">What is Dual Use?</AccordionTrigger>
                            <AccordionContent className="text-sm text-muted-foreground pt-1 pb-2">
                                Items that have both civilian and potential military applications, often requiring specific export controls.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="q-accuracy">
                            <AccordionTrigger className="text-sm py-2 hover:no-underline">How accurate is the analysis?</AccordionTrigger>
                            <AccordionContent className="text-sm text-muted-foreground pt-1 pb-2">
                                The AI provides a preliminary identification based on website text. Always verify results manually.
                            </AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="q-editing">
                            <AccordionTrigger className="text-sm py-2 hover:no-underline">Can I edit the results?</AccordionTrigger>
                            <AccordionContent className="text-sm text-muted-foreground pt-1 pb-2">
                                Yes, the next step involves reviewing and editing the product list before proceeding.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="bg-yellow-50 border border-yellow-200 shadow-sm rounded-xl">
                <CardHeader className="flex flex-row items-center gap-3 pb-2 transition-colors"> {/* Reduced pb */}
                    <LightbulbIcon className="h-5 w-5 text-amber-500" />
                    <CardTitle className="text-base font-semibold tracking-tight text-yellow-900">Tips</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-3"> {/* Adjusted padding */}
                    <p className="text-sm text-yellow-900/80">
                        Ensure your URL links to the main business or product page for the most accurate analysis.
                    </p>
                </CardContent>
            </Card>

            {/* Help Docs Card - Renamed */}
            <Card className="bg-muted/50 border border-muted shadow-sm rounded-xl">
                <CardHeader className="flex flex-row items-center gap-3 pb-2 transition-colors"> {/* Reduced pb */}
                   <FileText className="h-5 w-5 text-muted-foreground" />
                    {/* Renamed Title */}
                    <CardTitle className="text-base font-semibold tracking-tight">Help Docs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 pt-0 pb-3"> {/* Adjusted padding */}
                    {/* Using ExternalLink for clarity on links */}
                    <Button variant="link" className="p-0 h-auto text-sm text-muted-foreground hover:text-primary justify-start w-full transition-colors">
                         <ExternalLink className="mr-2 h-4 w-4 flex-shrink-0" /> Website Analysis Best Practices
                    </Button>
                    <Button variant="link" className="p-0 h-auto text-sm text-muted-foreground hover:text-primary justify-start w-full transition-colors">
                        <ExternalLink className="mr-2 h-4 w-4 flex-shrink-0" /> Understanding Compliance Flags
                    </Button>
                     {/* Placeholder for internal link */}
                     <Button variant="link" className="p-0 h-auto text-sm text-muted-foreground hover:text-primary justify-start w-full transition-colors">
                        <FileText className="mr-2 h-4 w-4 flex-shrink-0" /> Export Control Basics
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}