import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, X, ArrowRight, Loader2, Download, ChevronDown } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ColumnMapping {
  csvColumn: string;
  dbColumn: string;
  required: boolean;
  sample: string;
}

interface ValidationError {
  row: number;
  column: string;
  value: string;
  error: string;
}

interface EntityConfig {
  table: string;
  displayName: string;
  columns: {
    name: string;
    label: string;
    required: boolean;
    type: 'string' | 'number' | 'email' | 'phone' | 'date' | 'boolean';
  }[];
  uniqueFields: string[];
}

const entityConfigs: Record<string, EntityConfig> = {
  leads: {
    table: 'leads',
    displayName: 'Leads',
    columns: [
      { name: 'first_name', label: 'First Name', required: true, type: 'string' },
      { name: 'last_name', label: 'Last Name', required: true, type: 'string' },
      { name: 'email', label: 'Email', required: false, type: 'email' },
      { name: 'phone', label: 'Phone', required: false, type: 'phone' },
      { name: 'mobile', label: 'Mobile', required: false, type: 'phone' },
      { name: 'company', label: 'Company', required: false, type: 'string' },
      { name: 'job_title', label: 'Job Title', required: false, type: 'string' },
      { name: 'industry', label: 'Industry', required: false, type: 'string' },
      { name: 'website', label: 'Website', required: false, type: 'string' },
      { name: 'source', label: 'Source', required: false, type: 'string' },
      { name: 'rating', label: 'Rating', required: false, type: 'string' },
      { name: 'score', label: 'Score', required: false, type: 'number' },
      { name: 'description', label: 'Description', required: false, type: 'string' },
      { name: 'address_street', label: 'Street', required: false, type: 'string' },
      { name: 'address_city', label: 'City', required: false, type: 'string' },
      { name: 'address_state', label: 'State', required: false, type: 'string' },
      { name: 'address_postal_code', label: 'Postal Code', required: false, type: 'string' },
      { name: 'address_country', label: 'Country', required: false, type: 'string' },
    ],
    uniqueFields: ['email', 'phone'],
  },
  accounts: {
    table: 'accounts',
    displayName: 'Accounts',
    columns: [
      { name: 'name', label: 'Company Name', required: true, type: 'string' },
      { name: 'industry', label: 'Industry', required: false, type: 'string' },
      { name: 'website', label: 'Website', required: false, type: 'string' },
      { name: 'phone', label: 'Phone', required: false, type: 'phone' },
      { name: 'email', label: 'Email', required: false, type: 'email' },
      { name: 'annual_revenue', label: 'Annual Revenue', required: false, type: 'number' },
      { name: 'employee_count', label: 'Employees', required: false, type: 'number' },
      { name: 'source', label: 'Source', required: false, type: 'string' },
      { name: 'description', label: 'Description', required: false, type: 'string' },
      { name: 'address_street', label: 'Street', required: false, type: 'string' },
      { name: 'address_city', label: 'City', required: false, type: 'string' },
      { name: 'address_state', label: 'State', required: false, type: 'string' },
      { name: 'address_postal_code', label: 'Postal Code', required: false, type: 'string' },
      { name: 'address_country', label: 'Country', required: false, type: 'string' },
    ],
    uniqueFields: ['name', 'email'],
  },
  contacts: {
    table: 'contacts',
    displayName: 'Contacts',
    columns: [
      { name: 'first_name', label: 'First Name', required: true, type: 'string' },
      { name: 'last_name', label: 'Last Name', required: true, type: 'string' },
      { name: 'email', label: 'Email', required: false, type: 'email' },
      { name: 'phone', label: 'Phone', required: false, type: 'phone' },
      { name: 'mobile', label: 'Mobile', required: false, type: 'phone' },
      { name: 'job_title', label: 'Job Title', required: false, type: 'string' },
      { name: 'department', label: 'Department', required: false, type: 'string' },
      { name: 'description', label: 'Description', required: false, type: 'string' },
      { name: 'address_street', label: 'Street', required: false, type: 'string' },
      { name: 'address_city', label: 'City', required: false, type: 'string' },
      { name: 'address_state', label: 'State', required: false, type: 'string' },
      { name: 'address_postal_code', label: 'Postal Code', required: false, type: 'string' },
      { name: 'address_country', label: 'Country', required: false, type: 'string' },
    ],
    uniqueFields: ['email', 'phone'],
  },
};

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: 'leads' | 'accounts' | 'contacts';
  onImportComplete: () => void;
}

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

export function CSVImportDialog({
  open,
  onOpenChange,
  entityType,
  onImportComplete,
}: CSVImportDialogProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [duplicates, setDuplicates] = useState<number[]>([]);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  
  const config = entityConfigs[entityType];

  const resetState = () => {
    setStep('upload');
    setFile(null);
    setCsvData([]);
    setHeaders([]);
    setMappings([]);
    setValidationErrors([]);
    setDuplicates([]);
    setImportProgress(0);
    setImportedCount(0);
    setErrorCount(0);
  };

  const parseCSV = (text: string): string[][] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    return lines.map(line => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please select a CSV file',
      });
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Maximum file size is 10MB',
      });
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      
      if (parsed.length < 2) {
        toast({
          variant: 'destructive',
          title: 'Invalid CSV',
          description: 'CSV must have at least a header row and one data row',
        });
        return;
      }

      const csvHeaders = parsed[0];
      const data = parsed.slice(1);
      
      setHeaders(csvHeaders);
      setCsvData(data);
      
      // Auto-map columns
      const autoMappings: ColumnMapping[] = csvHeaders.map((header, index) => {
        const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const matchedColumn = config.columns.find(col => {
          const normalizedCol = col.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const normalizedName = col.name.toLowerCase();
          return normalizedCol === normalizedHeader || 
                 normalizedName === normalizedHeader ||
                 col.label.toLowerCase() === header.toLowerCase();
        });
        
        return {
          csvColumn: header,
          dbColumn: matchedColumn?.name || '',
          required: matchedColumn?.required || false,
          sample: data[0]?.[index] || '',
        };
      });
      
      setMappings(autoMappings);
      setStep('mapping');
    };
    
    reader.readAsText(selectedFile);
  }, [config.columns, toast]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(droppedFile);
      fileInputRef.current.files = dataTransfer.files;
      fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, []);

  const updateMapping = (csvColumn: string, dbColumn: string) => {
    setMappings(prev => prev.map(m => 
      m.csvColumn === csvColumn ? { ...m, dbColumn } : m
    ));
  };

  const validateData = () => {
    const errors: ValidationError[] = [];
    const duplicateRows: number[] = [];
    const seenValues = new Map<string, number>();
    
    csvData.forEach((row, rowIndex) => {
      mappings.forEach((mapping, colIndex) => {
        if (!mapping.dbColumn) return;
        
        const value = row[colIndex] || '';
        const columnConfig = config.columns.find(c => c.name === mapping.dbColumn);
        
        // Required field validation
        if (columnConfig?.required && !value.trim()) {
          errors.push({
            row: rowIndex + 2,
            column: mapping.csvColumn,
            value,
            error: 'Required field is empty',
          });
        }
        
        // Type validation
        if (value.trim() && columnConfig) {
          switch (columnConfig.type) {
            case 'email':
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                errors.push({
                  row: rowIndex + 2,
                  column: mapping.csvColumn,
                  value,
                  error: 'Invalid email format',
                });
              }
              break;
            case 'number':
              if (isNaN(Number(value))) {
                errors.push({
                  row: rowIndex + 2,
                  column: mapping.csvColumn,
                  value,
                  error: 'Must be a number',
                });
              }
              break;
            case 'phone':
              if (!/^[\d\s\-+().]+$/.test(value)) {
                errors.push({
                  row: rowIndex + 2,
                  column: mapping.csvColumn,
                  value,
                  error: 'Invalid phone format',
                });
              }
              break;
          }
        }
      });
      
      // Duplicate detection
      const uniqueKey = config.uniqueFields
        .map(field => {
          const mappingIndex = mappings.findIndex(m => m.dbColumn === field);
          return mappingIndex >= 0 ? row[mappingIndex]?.toLowerCase().trim() : '';
        })
        .filter(Boolean)
        .join('|');
      
      if (uniqueKey) {
        if (seenValues.has(uniqueKey)) {
          duplicateRows.push(rowIndex);
        } else {
          seenValues.set(uniqueKey, rowIndex);
        }
      }
    });
    
    setValidationErrors(errors);
    setDuplicates(duplicateRows);
    setStep('preview');
  };

  const performImport = async () => {
    if (!profile?.organization_id) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No organization found',
      });
      return;
    }

    setStep('importing');
    setImportProgress(0);
    setImportedCount(0);
    setErrorCount(0);

    const rowsToImport = csvData.filter((_, index) => 
      !skipDuplicates || !duplicates.includes(index)
    );
    
    const totalRows = rowsToImport.length;
    let imported = 0;
    let errors = 0;
    const batchSize = 50;
    
    for (let i = 0; i < rowsToImport.length; i += batchSize) {
      const batch = rowsToImport.slice(i, i + batchSize);
      
      const records = batch.map(row => {
        const record: Record<string, unknown> = {
          organization_id: profile.organization_id,
        };
        
        mappings.forEach((mapping, colIndex) => {
          if (mapping.dbColumn && row[colIndex]) {
            const columnConfig = config.columns.find(c => c.name === mapping.dbColumn);
            let value: unknown = row[colIndex].trim();
            
            if (columnConfig?.type === 'number' && value) {
              value = Number(value);
            } else if (columnConfig?.type === 'boolean') {
              value = ['true', '1', 'yes'].includes(String(value).toLowerCase());
            }
            
            record[mapping.dbColumn] = value;
          }
        });
        
        return record;
      });

      const { error } = await supabase
        .from(config.table as 'leads' | 'accounts' | 'contacts')
        .insert(records as never[]);

      if (error) {
        console.error('Import batch error:', error);
        errors += batch.length;
      } else {
        imported += batch.length;
      }
      
      setImportProgress(Math.round(((i + batch.length) / totalRows) * 100));
      setImportedCount(imported);
      setErrorCount(errors);
    }

    // Log the import action
    await supabase.rpc('log_audit_event', {
      p_organization_id: profile.organization_id,
      p_action: 'import',
      p_entity_type: entityType,
      p_entity_name: `CSV Import: ${file?.name}`,
      p_metadata: {
        file_name: file?.name,
        total_rows: totalRows,
        imported: imported,
        errors: errors,
        skipped_duplicates: duplicates.length,
      },
    });

    setStep('complete');
  };

  const downloadTemplate = () => {
    const headers = config.columns.map(c => c.label);
    const csv = headers.join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityType}_import_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const requiredMappingsMissing = config.columns
    .filter(c => c.required)
    .some(c => !mappings.find(m => m.dbColumn === c.name));

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetState();
      onOpenChange(newOpen);
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import {config.displayName}
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to import {config.displayName.toLowerCase()} in bulk
          </DialogDescription>
        </DialogHeader>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 py-4">
          {(['upload', 'mapping', 'preview', 'importing', 'complete'] as ImportStep[]).map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step === s 
                  ? 'bg-primary text-primary-foreground' 
                  : i < ['upload', 'mapping', 'preview', 'importing', 'complete'].indexOf(step)
                    ? 'bg-success text-success-foreground'
                    : 'bg-muted text-muted-foreground'
              }`}>
                {i < ['upload', 'mapping', 'preview', 'importing', 'complete'].indexOf(step) 
                  ? <CheckCircle2 className="h-4 w-4" />
                  : i + 1
                }
              </div>
              {i < 4 && <div className={`w-12 h-0.5 ${
                i < ['upload', 'mapping', 'preview', 'importing', 'complete'].indexOf(step)
                  ? 'bg-success'
                  : 'bg-muted'
              }`} />}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-hidden">
          {/* Upload Step */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Drop your CSV file here</p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse (max 10MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Need a template?</p>
                  <p className="text-sm text-muted-foreground">
                    Download a CSV template with all available columns
                  </p>
                </div>
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>
            </div>
          )}

          {/* Mapping Step */}
          {step === 'mapping' && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Map your columns</AlertTitle>
                <AlertDescription>
                  Match CSV columns to {config.displayName.toLowerCase()} fields. Required fields are marked with *.
                </AlertDescription>
              </Alert>

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {mappings.map((mapping) => {
                    const isRequired = config.columns.find(c => c.name === mapping.dbColumn)?.required;
                    return (
                      <div key={mapping.csvColumn} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{mapping.csvColumn}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            Sample: {mapping.sample || '(empty)'}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Select
                          value={mapping.dbColumn || 'skip'}
                          onValueChange={(value) => updateMapping(mapping.csvColumn, value === 'skip' ? '' : value)}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="skip">
                              <span className="text-muted-foreground">Skip this column</span>
                            </SelectItem>
                            {config.columns.map((col) => (
                              <SelectItem 
                                key={col.name} 
                                value={col.name}
                                disabled={mappings.some(m => m.dbColumn === col.name && m.csvColumn !== mapping.csvColumn)}
                              >
                                {col.label} {col.required && '*'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {isRequired && mapping.dbColumn && (
                          <Badge variant="outline" className="bg-primary/10 text-primary">Required</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {requiredMappingsMissing && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Missing required fields</AlertTitle>
                  <AlertDescription>
                    Please map all required fields: {config.columns.filter(c => c.required).map(c => c.label).join(', ')}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-2xl font-bold">{csvData.length}</p>
                    <p className="text-sm text-muted-foreground">Total Rows</p>
                  </div>
                  <div className="p-3 bg-warning/10 rounded-lg text-center">
                    <p className="text-2xl font-bold text-warning">{duplicates.length}</p>
                    <p className="text-sm text-muted-foreground">Duplicates</p>
                  </div>
                  <div className="p-3 bg-destructive/10 rounded-lg text-center">
                    <p className="text-2xl font-bold text-destructive">{validationErrors.length}</p>
                    <p className="text-sm text-muted-foreground">Errors</p>
                  </div>
                </div>
              </div>

              {duplicates.length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-warning/10 rounded-lg">
                  <Checkbox
                    id="skipDuplicates"
                    checked={skipDuplicates}
                    onCheckedChange={(checked) => setSkipDuplicates(checked as boolean)}
                  />
                  <label htmlFor="skipDuplicates" className="text-sm cursor-pointer">
                    Skip {duplicates.length} duplicate rows (based on {config.uniqueFields.join(', ')})
                  </label>
                </div>
              )}

              <Tabs defaultValue="preview">
                <TabsList>
                  <TabsTrigger value="preview">Data Preview</TabsTrigger>
                  <TabsTrigger value="errors" disabled={validationErrors.length === 0}>
                    Errors ({validationErrors.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="preview" className="mt-4">
                  <ScrollArea className="h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px]">Row</TableHead>
                          {mappings.filter(m => m.dbColumn).map(m => (
                            <TableHead key={m.csvColumn}>{m.csvColumn}</TableHead>
                          ))}
                          <TableHead className="w-[100px]">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvData.slice(0, 10).map((row, rowIndex) => {
                          const rowErrors = validationErrors.filter(e => e.row === rowIndex + 2);
                          const isDuplicate = duplicates.includes(rowIndex);
                          
                          return (
                            <TableRow 
                              key={rowIndex}
                              className={isDuplicate ? 'bg-warning/10' : rowErrors.length > 0 ? 'bg-destructive/10' : ''}
                            >
                              <TableCell className="font-mono text-xs">{rowIndex + 2}</TableCell>
                              {mappings.filter(m => m.dbColumn).map((m, colIndex) => (
                                <TableCell key={m.csvColumn} className="max-w-[150px] truncate">
                                  {row[headers.indexOf(m.csvColumn)] || '-'}
                                </TableCell>
                              ))}
                              <TableCell>
                                {isDuplicate ? (
                                  <Badge variant="outline" className="bg-warning/10 text-warning">Duplicate</Badge>
                                ) : rowErrors.length > 0 ? (
                                  <Badge variant="outline" className="bg-destructive/10 text-destructive">Error</Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-success/10 text-success">Valid</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    {csvData.length > 10 && (
                      <p className="text-sm text-muted-foreground text-center mt-4">
                        Showing first 10 of {csvData.length} rows
                      </p>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="errors" className="mt-4">
                  <ScrollArea className="h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px]">Row</TableHead>
                          <TableHead>Column</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validationErrors.map((error, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-xs">{error.row}</TableCell>
                            <TableCell>{error.column}</TableCell>
                            <TableCell className="max-w-[150px] truncate">{error.value || '(empty)'}</TableCell>
                            <TableCell className="text-destructive">{error.error}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Importing Step */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <p className="text-lg font-medium">Importing {config.displayName}...</p>
                <p className="text-sm text-muted-foreground mt-1">Please don't close this dialog</p>
              </div>
              <div className="w-full max-w-md space-y-2">
                <Progress value={importProgress} className="h-2" />
                <p className="text-sm text-center text-muted-foreground">
                  {importProgress}% complete • {importedCount} imported • {errorCount} errors
                </p>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className={`p-4 rounded-full ${errorCount === 0 ? 'bg-success/10' : 'bg-warning/10'}`}>
                {errorCount === 0 ? (
                  <CheckCircle2 className="h-12 w-12 text-success" />
                ) : (
                  <AlertCircle className="h-12 w-12 text-warning" />
                )}
              </div>
              <div className="text-center">
                <p className="text-lg font-medium">Import Complete</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {importedCount} {config.displayName.toLowerCase()} imported successfully
                </p>
              </div>
              <div className="grid grid-cols-3 gap-8 text-center">
                <div>
                  <p className="text-2xl font-bold text-success">{importedCount}</p>
                  <p className="text-sm text-muted-foreground">Imported</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-warning">{skipDuplicates ? duplicates.length : 0}</p>
                  <p className="text-sm text-muted-foreground">Skipped</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">{errorCount}</p>
                  <p className="text-sm text-muted-foreground">Errors</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          {step === 'upload' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}
          
          {step === 'mapping' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button onClick={validateData} disabled={requiredMappingsMissing}>
                Continue to Preview
              </Button>
            </>
          )}
          
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('mapping')}>
                Back
              </Button>
              <Button 
                onClick={performImport}
                disabled={validationErrors.some(e => 
                  config.columns.find(c => c.name === mappings.find(m => m.csvColumn === e.column)?.dbColumn)?.required
                )}
              >
                Import {csvData.length - (skipDuplicates ? duplicates.length : 0)} Records
              </Button>
            </>
          )}
          
          {step === 'complete' && (
            <Button onClick={() => {
              onOpenChange(false);
              onImportComplete();
            }}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// CSV Export utility function
export async function exportToCSV(
  data: Record<string, unknown>[],
  filename: string,
  columns: { key: string; label: string }[]
) {
  if (data.length === 0) {
    return;
  }

  const headers = columns.map(c => c.label);
  const rows = data.map(row => 
    columns.map(col => {
      const value = row[col.key];
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      // Escape quotes and wrap in quotes if contains comma or quote
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    })
  );

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
