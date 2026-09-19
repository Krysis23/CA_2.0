import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { ArrowLeft, UploadCloud, Loader2, FileText, CheckCircle2, Download } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AnalyzeResult {
  analysis_summary: string;
  itr_form: string;
  checklist: string[];
  missing_info: string[];
}

export default function ITRFilingPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    setResult(null);

    try {
      // 1. Upload the file to extract data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('context', 'itr');

      const uploadRes = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to process document');
      }

      const uploadData = await uploadRes.json();
      const extractedData = uploadData.doc_data || {};

      // 2. Send extracted data for ITR Quick Analysis
      const analyzeRes = await fetch('http://localhost:8000/api/itr/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extracted_data: extractedData }),
      });

      if (!analyzeRes.ok) {
         throw new Error('Failed to analyze ITR requirements');
      }

      const analyzeData: AnalyzeResult = await analyzeRes.json();
      setResult(analyzeData);
      toast.success("Analysis complete!");

    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  const exportPDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text("Income Tax Return (ITR) Checklist", 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Recommended Form: ${result.itr_form}`, 14, 32);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    const splitSummary = doc.splitTextToSize(`Analysis Summary: ${result.analysis_summary}`, 180);
    doc.text(splitSummary, 14, 40);
    
    let currentY = 40 + (splitSummary.length * 5) + 5;
    
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Required Documents:", 14, currentY);
    currentY += 5;
    
    const checklistData = result.checklist.map(item => [item]);
    
    autoTable(doc, {
      startY: currentY,
      head: [['Document Name']],
      body: checklistData,
      theme: 'grid',
      headStyles: { fillColor: [20, 184, 166] },
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 10;
    
    if (result.missing_info.length > 0) {
       doc.setFontSize(14);
       doc.text("Additional Details Needed:", 14, currentY);
       currentY += 5;
       const missingData = result.missing_info.map(item => [item]);
       autoTable(doc, {
         startY: currentY,
         head: [['Detail / Question']],
         body: missingData,
         theme: 'grid',
         headStyles: { fillColor: [245, 158, 11] },
       });
    }

    doc.save(`ITR_Checklist_${result.itr_form || 'Unknown'}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-12 overflow-y-auto scrollbar-thin">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link to="/itr-hub" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> Back to Hub
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Quick ITR Analyse</h1>
          <p className="text-muted-foreground mt-2">
            Upload your Form 16, AIS, or Bank Statement to instantly determine your ITR form and required documents.
          </p>
        </div>

        {/* Upload Area */}
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer
            ${isDragActive ? 'border-teal-500 bg-teal-500/5' : 'border-border hover:border-teal-500/50 hover:bg-card'}
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          
          <div className="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center mx-auto mb-4">
            {isUploading ? (
              <Loader2 size={32} className="text-teal-500 animate-spin" />
            ) : (
              <UploadCloud size={32} className="text-teal-500" />
            )}
          </div>
          
          <h3 className="text-lg font-medium text-foreground mb-1">
            {isUploading ? 'Analyzing Document...' : 'Drop your document here'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isUploading ? 'Extracting financial data and mapping to ITR rules' : 'PDF or Images up to 10MB'}
          </p>
        </div>

        {/* Results Area */}
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Form Recommendation */}
            <div className="md:col-span-1 bg-card border border-border rounded-2xl p-6">
              <p className="text-sm font-semibold text-muted-foreground uppercase mb-4">Recommended Form</p>
              <div className="text-4xl font-bold text-teal-400 mb-2">{result.itr_form}</div>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {result.analysis_summary}
              </p>
            </div>

            {/* Checklist & Missing Info */}
            <div className="md:col-span-2 bg-card border border-border rounded-2xl p-6 space-y-6">
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <FileText size={20} className="text-teal-500" />
                  Required Documents
                </h3>
                <button 
                  onClick={exportPDF}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted hover:bg-teal-500/10 text-teal-500 text-sm font-medium rounded-lg transition-colors border border-border hover:border-teal-500/30"
                >
                  <Download size={16} />
                  Download PDF
                </button>
              </div>
              
              <div>
                {result.checklist.length > 0 ? (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {result.checklist.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-foreground bg-muted/40 p-3 rounded-xl border border-border">
                        <CheckCircle2 size={16} className="text-success shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No specific documents identified.</p>
                )}
              </div>

              {result.missing_info.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-amber-500 mb-3">Additional Details Needed</h3>
                  <ul className="list-disc pl-4 space-y-1">
                    {result.missing_info.map((info, idx) => (
                      <li key={idx} className="text-sm text-amber-500/80">{info}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground mt-3">
                    For a more accurate assessment, you can use the <Link to="/itr-chat" className="text-teal-400 hover:underline">Guided Filing Chatbot</Link>.
                  </p>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
