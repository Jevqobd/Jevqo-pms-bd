/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Order,
  Employee,
  PaymentRecord,
  Expense,
  Customer,
  InventoryItem,
  Vendor,
  CompanyAsset,
} from '../types/erp';
import { parseBulkDelimitedText, calculateOrderTotals } from '../utils/erpLogic';
import { ErpStorageService } from '../services/erpStorageService';
import {
  Upload,
  Download,
  Database,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  Users,
  DollarSign,
  TrendingDown,
  Star,
  Package,
  Truck,
  Laptop,
  Sparkles,
  Trash2,
  Check,
  AlertCircle,
} from 'lucide-react';

export type BulkImportCategory =
  | 'orders'
  | 'employees'
  | 'payments'
  | 'expenses'
  | 'customers'
  | 'inventory'
  | 'vendors'
  | 'assets';

interface BulkImportModuleProps {
  onImportComplete?: (summary: string) => void;
}

interface CategoryConfig {
  id: BulkImportCategory;
  titleEn: string;
  titleBn: string;
  descEn: string;
  descBn: string;
  icon: React.ReactNode;
  columns: string[];
  sampleCsv: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'orders',
    titleEn: 'Orders / Job Cards',
    titleBn: 'English Standard Documentation',
    descEn: 'Migrate offline jersey orders, team kits, quantities, fabrics, and advance payments',
    descBn: 'English Standard Documentation',
    icon: <Layers className="w-4 h-4" />,
    columns: [
      'orderNumber',
      'clientName',
      'clientPhone',
      'teamOrClub',
      'sportType',
      'fabricType',
      'gsm',
      'collarType',
      'totalQuantity',
      'unitPrice',
      'advanceAmount',
    ],
    sampleCsv: `orderNumber,clientName,clientPhone,teamOrClub,sportType,fabricType,gsm,collarType,totalQuantity,unitPrice,advanceAmount
SW-2026-1101,Sylhet Strikers Academy,+8801711001122,Sylhet Strikers XI,Cricket,Micro-Eyelet 160 GSM,160,Polo Ribbed,35,17.5,300
SW-2026-1102,Dhaka University FC,+8801819223344,DU Red Lions,Football / Soccer,Honeycomb Mesh 170 GSM,170,V-Neck,50,16.0,450
SW-2026-1103,Bashundhara Runners Club,+8801911556677,BD Marathon Crew,Athletics, Jacquard Breathable 140 GSM,140,Round Neck,80,14.5,600`,
  },
  {
    id: 'employees',
    titleEn: 'Employees & Factory Staff',
    titleBn: 'English Standard Documentation',
    descEn: 'Bulk import HQ, Tongi Print, and Mirpur Sewing staff with designation, post, NID & salary',
    descBn: 'English Standard Documentation',
    icon: <Users className="w-4 h-4" />,
    columns: [
      'employeeId',
      'name',
      'phone',
      'email',
      'designation',
      'post',
      'department',
      'location',
      'baseSalary',
      'nid',
    ],
    sampleCsv: `employeeId,name,phone,email,designation,post,department,location,baseSalary,nid
EMP-101,Md.Soh Sohel Rana,+8801712334455,sohel@ridwear.com,Senior Sublimation Operator,Rotary Heat Press Lead,Print Production,print_factory,28000,1993456789012
EMP-102, Nasrin Akter,+8801813445566,nasrin@ridwear.com,Quality Control Inspector,Sewing Line A QC,Apparel Assembly,sewing_factory,24000,1996789012345
EMP-103, Ariful Islam,+8801914556677,ariful@ridwear.com,CAD Pattern Grader,Design Team 2 Specialist,Pre-Press Design,head_office,35000,1991234567890`,
  },
  {
    id: 'payments',
    titleEn: 'Income / Client Payments',
    titleBn: 'English Standard Documentation',
    descEn: 'Import historical customer payments, advance deposits, bKash/Bank receipts',
    descBn: 'English Standard Documentation',
    icon: <DollarSign className="w-4 h-4" />,
    columns: ['date', 'partyName', 'amount', 'method', 'transactionRef', 'invoiceOrBillRef', 'notes'],
    sampleCsv: `date,partyName,amount,method,transactionRef,invoiceOrBillRef,notes
2026-10-25,Sylhet Strikers Academy,300,bkash_nagad,BKASH-TXN-99102,INV-2026-1101,50% Advance payment via bKash Merchant
2026-10-26,Dhaka University FC,450,bank_transfer,CITYBANK-88219,INV-2026-1102,Advance deposit to City Bank Corporate A/C
2026-10-28,Uttara Sporting Club,820,cash,CASH-RCPT-405,INV-2026-0899,Final delivery settlement at Banani HQ`,
  },
  {
    id: 'expenses',
    titleEn: 'Expenses / Factory Costs',
    titleBn: 'English Standard Documentation',
    descEn: 'Migrate daily factory expenses, electricity, courier bills, ink/paper purchase & maintenance',
    descBn: 'English Standard Documentation',
    icon: <TrendingDown className="w-4 h-4" />,
    columns: ['date', 'title', 'category', 'location', 'amount', 'recordedBy', 'notes'],
    sampleCsv: `date,title,category,location,amount,recordedBy,notes
2026-10-24,Tongi Factory Industrial Electricity & Generator Fuel,Utilities,print_factory,420,Accounts Lead,October diesel & DESCO bill
2026-10-26,Mirpur Flatlock Machine Needles & Bobbin Cases,Maintenance,sewing_factory,185,Mirpur Manager,Purchased 12 boxes Organ needles
2026-10-28,Steadfast & Pathao Bulk Courier Settlement,Logistics,head_office,260,Marketing Lead,Weekly B2B club parcel dispatch`,
  },
  {
    id: 'customers',
    titleEn: 'Customers / B2B & B2C Clients',
    titleBn: 'English Standard Documentation',
    descEn: 'Import sports academies, corporate clients, schools, and retail buyers with loyalty tiers',
    descBn: 'English Standard Documentation',
    icon: <Star className="w-4 h-4" />,
    columns: [
      'name',
      'companyOrClub',
      'type',
      'phone',
      'email',
      'address',
      'privilegeTier',
      'returningRatio',
    ],
    sampleCsv: `name,companyOrClub,type,phone,email,address,privilegeTier,returningRatio
Coach Kamrul Hasan,Chattogram Challengers Youth,b2b,+8801711889900,kamrul@ctgchallengers.bd,Agrabad C/A Chattogram,gold,94
Tanvir Mahmud,North South University Athletics,b2b,+8801812776655,sports@nsu.edu.bd,Bashundhara R/A Dhaka,platinum_vip,98
Sabbir Hossain,Mirpur Eleven Star Club,b2c,+8801615443322,sabbir11@gmail.com,Mirpur-10 Dhaka,silver,85`,
  },
  {
    id: 'inventory',
    titleEn: 'Materials & Raw Stock',
    titleBn: 'English Standard Documentation',
    descEn: 'Migrate polyester fabrics (KG/Meters), sublimation ink, transfer paper, collars & ribbons',
    descBn: 'English Standard Documentation',
    icon: <Package className="w-4 h-4" />,
    columns: [
      'sku',
      'name',
      'category',
      'location',
      'currentStock',
      'unit',
      'gsm',
      'minimumThreshold',
      'unitCost',
    ],
    sampleCsv: `sku,name,category,location,currentStock,unit,gsm,minimumThreshold,unitCost
FAB-ME-160,White Micro-Eyelet Sublimation Roll (160 GSM),fabric,print_factory,1450,meters,160,300,2.10
FAB-HC-180,Honeycomb Pro Jersey Fabric (KG Stock),fabric,print_factory,420,kg,180,80,6.80
TRM-COL-01,Jacquard Ribbed V-Neck Collar (Ready Pcs),trims,sewing_factory,950,pieces,220,200,0.35
TRM-RIB-02,Sublimation Neck Tape & Lanyard Ribbon Roll,accessories,print_factory,1200,meters,120,250,0.12`,
  },
  {
    id: 'vendors',
    titleEn: 'Vendors & Suppliers',
    titleBn: 'English Standard Documentation',
    descEn: 'Import fabric knitting mills, ink importers, paper suppliers, and trim vendors',
    descBn: 'English Standard Documentation',
    icon: <Truck className="w-4 h-4" />,
    columns: [
      'supplierCode',
      'name',
      'category',
      'contactPerson',
      'phone',
      'email',
      'address',
      'balanceDue',
      'paymentTerms',
    ],
    sampleCsv: `supplierCode,name,category,contactPerson,phone,email,address,balanceDue,paymentTerms
SUP-201,Narayanganj Knitwear & Polyester Mills,fabric_mill,Haji Abdul Latif,+8801711332211,sales@nknitmills.bd,BSCIC Industrial Estate Narayanganj,1250,Net 30 Days
SUP-202,Korea Sublimation Ink & Transfer BD,ink_supplier,Engr. Faruk Ahmed,+8801819445566,info@koreasubbd.com,Uttara Sector 11 Dhaka,450,50% Advance
SUP-203,Gazipur Collar Rib & Elastic Accessories,accessories,Md. Rubel Hossain,+8801912667788,rubel@gazipurtrims.com,Konabari Gazipur,0,Cash on Delivery`,
  },
  {
    id: 'assets',
    titleEn: 'Other Data: Company Assets & Devices',
    titleBn: 'English Standard Documentation',
    descEn: 'Migrate sublimation printers, rotary heat presses, sewing machines, and workstation PCs',
    descBn: 'English Standard Documentation',
    icon: <Laptop className="w-4 h-4" />,
    columns: [
      'assetCode',
      'name',
      'category',
      'brandModel',
      'serialNumber',
      'location',
      'assignedEmployeeName',
      'purchaseValue',
    ],
    sampleCsv: `assetCode,name,category,brandModel,serialNumber,location,assignedEmployeeName,purchaseValue
AST-PRT-09,Epson SureColor F9470H High-Speed Sublimation Printer,sublimation_printer,Epson F9470H,SN-EP-992811,print_factory,Jahangir Alam,18500
AST-HTP-04,Industrial Roll-to-Roll Rotary Heat Press 1.8m,heat_press,Jiangchuan JC-1800,SN-JC-44102,print_factory,Jahangir Alam,14200
AST-SEW-22,Juki 4-Needle Flatlock Sportswear Stitcher,sewing_machine,Juki MF-7923,SN-JK-77190,sewing_factory,Rony Mia,2400`,
  },
];

export const BulkImportModule: React.FC<BulkImportModuleProps> = ({ onImportComplete }) => {
  const [selectedCategory, setSelectedCategory] = useState<BulkImportCategory>('orders');
  const [rawInputText, setRawInputText] = useState<string>(CATEGORIES[0].sampleCsv);
  const [importBanner, setImportBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const activeConfig =
    CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];

  const parsedPreview = parseBulkDelimitedText(rawInputText);

  const handleSelectCategory = (catId: BulkImportCategory) => {
    setSelectedCategory(catId);
    const found = CATEGORIES.find((c) => c.id === catId);
    if (found) {
      setRawInputText(found.sampleCsv);
    }
    setImportBanner(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = String(evt.target?.result || '');
      // If JSON file, convert array of objects to CSV text so user can preview it in table
      if (file.name.endsWith('.json')) {
        try {
          const arr = JSON.parse(content);
          if (Array.isArray(arr) && arr.length > 0) {
            const keys = Object.keys(arr[0]);
            const csvLines = [
              keys.join(','),
              ...arr.map((row) => keys.map((k) => String(row[k] ?? '')).join(',')),
            ];
            setRawInputText(csvLines.join('\n'));
            return;
          }
        } catch (err) {
          console.warn('JSON parse fallback to raw text', err);
        }
      }
      setRawInputText(content);
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([activeConfig.sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ridwear_erp_${activeConfig.id}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExecuteBulkImport = async () => {
    if (parsedPreview.rows.length === 0) {
      setImportBanner({
        type: 'error',
        message:
          'No valid rows detected! Please paste CSV/Excel rows or click Load Sample Data.',
      });
      return;
    }

    setIsImporting(true);
    try {
      const rows = parsedPreview.rows;
      const nowIso = new Date().toISOString();
      const todayDate = nowIso.split('T')[0];

      if (selectedCategory === 'orders') {
        const newOrders: Order[] = rows.map((r, i) => {
          const qty = Number(r.totalQuantity) || 25;
          const price = Number(r.unitPrice) || 16;
          const adv = Number(r.advanceAmount) || 0;
          const totals = calculateOrderTotals(qty, price, adv, adv > 0);
          return {
            id: `ord-bulk-${Date.now()}-${i}`,
            orderNumber: r.orderNumber || `SW-2026-${Math.floor(2000 + Math.random() * 7999)}`,
            orderType: 'b2b',
            clientName: r.clientName || 'Imported Client',
            clientPhone: r.clientPhone || '+8801700000000',
            teamOrClub: r.teamOrClub || 'Custom Team Kit',
            sportType: r.sportType || 'Football / Soccer',
            fabricType: r.fabricType || 'Micro-Eyelet 160 GSM',
            gsm: Number(r.gsm) || 160,
            collarType: r.collarType || 'V-Neck',
            totalQuantity: totals.totalQuantity,
            unitPrice: price,
            totalAmount: totals.totalAmount,
            advanceAmount: totals.advanceAmount,
            dueAmount: totals.dueAmount,
            paymentStatus: totals.paymentStatus,
            sizeBreakdown: { S: Math.floor(qty * 0.2), M: Math.floor(qty * 0.4), L: Math.ceil(qty * 0.4) },
            stage: adv > 0 ? 'payment_verified' : 'payment_pending',
            currentLocation: 'head_office',
            createdAt: nowIso,
            updatedAt: nowIso,
            createdBy: 'bulk_migration@ridwear.com',
          };
        });
        await ErpStorageService.bulkImportOrders(newOrders);
      } else if (selectedCategory === 'employees') {
        const newEmps: Employee[] = rows.map((r, i) => ({
          id: `emp-bulk-${Date.now()}-${i}`,
          employeeId: r.employeeId || `EMP-${200 + i}`,
          name: r.name || 'Imported Staff',
          phone: r.phone || '+8801700000000',
          email: r.email || `staff${i}@ridwear.com`,
          role:
            r.location === 'print_factory'
              ? 'print_factory'
              : r.location === 'sewing_factory'
              ? 'sewing_factory'
              : 'marketing',
          department: r.department || 'Production Operations',
          designation: r.designation || 'Production Specialist',
          post: r.post || 'Floor Operator',
          location:
            r.location === 'print_factory' || r.location === 'sewing_factory'
              ? r.location
              : 'head_office',
          baseSalary: Number(r.baseSalary) || 22000,
          hourlyOvertimeRate: 120,
          joiningDate: todayDate,
          shift: 'morning',
          status: 'active',
          activeStatus: 'online',
          nid: r.nid || '1995000000000',
        }));
        await ErpStorageService.bulkImportEmployees(newEmps);
      } else if (selectedCategory === 'payments') {
        const newPayments: PaymentRecord[] = rows.map((r, i) => ({
          id: `pay-bulk-${Date.now()}-${i}`,
          date: r.date || todayDate,
          type: 'received_from_client',
          partyType: 'client',
          partyId: `cust-bulk-${i}`,
          partyName: r.partyName || 'Client Payment',
          amount: Number(r.amount) || 100,
          method: (r.method as any) || 'bkash_nagad',
          transactionRef: r.transactionRef || `TXN-${Date.now()}-${i}`,
          invoiceOrBillRef: r.invoiceOrBillRef || 'INV-MIGRATED',
          notes: r.notes || 'Migrated from offline register',
          verifiedBy: 'Bulk Migration Hub',
        }));
        await ErpStorageService.bulkImportPayments(newPayments);
      } else if (selectedCategory === 'expenses') {
        const newExpenses: Expense[] = rows.map((r, i) => ({
          id: `exp-bulk-${Date.now()}-${i}`,
          date: r.date || todayDate,
          title: r.title || 'Migrated Factory Expense',
          category: r.category || 'Operations',
          location:
            r.location === 'print_factory' || r.location === 'sewing_factory'
              ? r.location
              : 'head_office',
          amount: Number(r.amount) || 50,
          recordedBy: r.recordedBy || 'Accounts Admin',
          notes: r.notes || 'Imported via Offline-to-Online Migration',
        }));
        await ErpStorageService.bulkImportExpenses(newExpenses);
      } else if (selectedCategory === 'customers') {
        const newCustomers: Customer[] = rows.map((r, i) => ({
          id: `cust-bulk-${Date.now()}-${i}`,
          name: r.name || 'Imported Customer',
          companyOrClub: r.companyOrClub || r.name || 'Sports Club',
          type: r.type === 'b2c' ? 'b2c' : 'b2b',
          phone: r.phone || '+8801700000000',
          email: r.email || 'client@club.bd',
          address: r.address || 'Dhaka, Bangladesh',
          creditLimit: 5000,
          outstandingBalance: 0,
          status: 'vip',
          privilegeTier: (r.privilegeTier as any) || 'gold',
          returningRatio: Number(r.returningRatio) || 90,
          starRating: 5,
          portalAccessCode: `PORTAL-${Math.floor(1000 + Math.random() * 9000)}`,
          createdAt: todayDate,
        }));
        await ErpStorageService.bulkImportCustomers(newCustomers);
      } else if (selectedCategory === 'inventory') {
        const newItems: InventoryItem[] = rows.map((r, i) => ({
          id: `inv-bulk-${Date.now()}-${i}`,
          sku: r.sku || `SKU-MIG-${100 + i}`,
          name: r.name || 'Imported Raw Material',
          category: (r.category as any) || 'fabric',
          location:
            r.location === 'print_factory' || r.location === 'sewing_factory'
              ? r.location
              : 'print_factory',
          currentStock: Number(r.currentStock) || 100,
          unit: r.unit || 'meters',
          preferredMetric: r.unit || 'meters',
          gsm: Number(r.gsm) || 160,
          minimumThreshold: Number(r.minimumThreshold) || 50,
          unitCost: Number(r.unitCost) || 2.0,
          updatedAt: nowIso,
        }));
        await ErpStorageService.bulkImportInventory(newItems);
      } else if (selectedCategory === 'vendors') {
        const newVendors: Vendor[] = rows.map((r, i) => ({
          id: `vnd-bulk-${Date.now()}-${i}`,
          supplierCode: r.supplierCode || `SUP-${300 + i}`,
          name: r.name || 'Imported Supplier',
          category: (r.category as any) || 'fabric_mill',
          contactPerson: r.contactPerson || 'Manager',
          phone: r.phone || '+8801700000000',
          email: r.email || 'supplier@mill.bd',
          address: r.address || 'Narayanganj / Gazipur',
          totalPurchased: Number(r.balanceDue) || 1000,
          totalPaid: 0,
          balanceDue: Number(r.balanceDue) || 0,
          paymentTerms: r.paymentTerms || 'Net 30 Days',
          rating: 5,
          onTimeDeliveryRate: 96,
          qualityScore: 98,
          status: 'preferred',
        }));
        await ErpStorageService.bulkImportVendors(newVendors);
      } else if (selectedCategory === 'assets') {
        const newAssets: CompanyAsset[] = rows.map((r, i) => ({
          id: `ast-bulk-${Date.now()}-${i}`,
          assetCode: r.assetCode || `AST-MIG-${100 + i}`,
          name: r.name || 'Imported Factory Machine',
          category: (r.category as any) || 'sewing_machine',
          brandModel: r.brandModel || 'Industrial Pro',
          serialNumber: r.serialNumber || `SN-${Date.now()}-${i}`,
          location:
            r.location === 'print_factory' || r.location === 'sewing_factory'
              ? r.location
              : 'print_factory',
          assignedEmployeeName: r.assignedEmployeeName || 'Unassigned',
          status: 'operational',
          purchaseDate: todayDate,
          purchaseValue: Number(r.purchaseValue) || 1500,
        }));
        await ErpStorageService.bulkImportAssets(newAssets);
      }

      const msg = `Successfully migrated ${rows.length} ${activeConfig.titleEn} (${activeConfig.titleBn}) records from offline to online ERP!`;
      setImportBanner({ type: 'success', message: msg });
      onImportComplete?.(msg);
    } catch (err) {
      console.error(err);
      setImportBanner({
        type: 'error',
        message: 'Failed to import records. Please check column format.',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-xs">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-teal-950/80 to-indigo-950/90 border border-emerald-500/30 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-white tracking-tight">
                Bulk Data Import & Offline-to-Online Migration Hub
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                CSV • Excel Copy-Paste • JSON
              </span>
            </div>
            <p className="text-sm font-bold text-emerald-300 font-bangla mt-0.5">
 
            </p>
            <p className="text-xs text-slate-300 mt-1">
              Upload CSV/Excel files or copy-paste rows directly from your offline spreadsheets to migrate your entire sportswear business online in seconds.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleDownloadTemplate}
            className="btn-press px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV Template</span>
          </button>
        </div>
      </div>

      {importBanner && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
            importBanner.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5 font-bold text-xs">
            {importBanner.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{importBanner.message}</span>
          </div>
          <button
            onClick={() => setImportBanner(null)}
            className="text-xs underline opacity-80 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 8 Data Category Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {CATEGORIES.map((cat) => {
          const isSelected = cat.id === selectedCategory;
          return (
            <button
              key={cat.id}
              onClick={() => handleSelectCategory(cat.id)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                isSelected
                  ? 'bg-emerald-950/60 border-emerald-500 shadow-lg shadow-emerald-950/50'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={`p-2 rounded-xl ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-emerald-400'
                    }`}
                  >
                    {cat.icon}
                  </div>
                  {isSelected && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      Selected
                    </span>
                  )}
                </div>
                <h3 className="font-black text-white text-xs mt-2.5">{cat.titleEn}</h3>
                <div className="text-xs font-bold text-emerald-400 font-bangla">
                  {cat.titleBn}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{cat.descBn}</p>
              </div>
              <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono truncate">
                Fields: {cat.columns.slice(0, 4).join(', ')}...
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Workspace: File Upload + Raw Editor + Live Table Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 5 Cols: CSV / Excel Paste Input */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-black text-sm text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>
                  1. Upload File or Paste Excel Rows ({activeConfig.titleBn})
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Supports comma (CSV), tab (Excel copy-paste), or pipe (`|`) separated data
              </p>
            </div>
          </div>

          {/* Upload CSV / JSON file */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="btn-press px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload CSV / JSON File</span>
              <input
                type="file"
                accept=".csv,.tsv,.txt,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={() => setRawInputText(activeConfig.sampleCsv)}
              className="btn-press px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Sample</span>
            </button>

            <button
              type="button"
              onClick={() => setRawInputText('')}
              className="btn-press px-2.5 py-2 rounded-xl bg-slate-950 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-800 font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 block">
              Expected Columns:
            </label>
            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[10px] text-emerald-400 break-all">
              {activeConfig.columns.join(', ')}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 block">
              Paste CSV / Spreadsheet Data Here:
            </label>
            <textarea
              rows={9}
              value={rawInputText}
              onChange={(e) => setRawInputText(e.target.value)}
              placeholder="Paste rows from Excel, Google Sheets, or CSV file..."
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-[11px] focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Right 7 Cols: Live Preview Table & 1-Click Import Button */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-sm text-white">
                  2. Live Data Migration Preview)
                </h3>
                <p className="text-[11px] text-slate-400 font-bangla">
 &ldquo;Import All Records&rdquo; 
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold text-xs">
                {parsedPreview.rows.length} Valid Records
              </span>
            </div>

            {parsedPreview.rows.length === 0 ? (
              <div className="p-10 text-center rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 space-y-2">
                <Database className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="font-bold text-slate-300">
                  No data rows parsed yet
                </p>
                <p className="text-[11px]">
                  Paste CSV/Excel data on the left or click &ldquo;Load Sample&rdquo; to preview records.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-80 rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-emerald-400 font-mono">
                      <th className="py-2 px-2.5">#</th>
                      {parsedPreview.headers.map((h) => (
                        <th key={h} className="py-2 px-2.5 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {parsedPreview.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/60">
                        <td className="py-2 px-2.5 font-mono text-slate-500">{idx + 1}</td>
                        {parsedPreview.headers.map((h) => (
                          <td
                            key={h}
                            className="py-2 px-2.5 text-slate-200 whitespace-nowrap max-w-[180px] truncate"
                          >
                            {row[h]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400 font-bangla">
 ।
            </div>
            <button
              type="button"
              disabled={isImporting || parsedPreview.rows.length === 0}
              onClick={handleExecuteBulkImport}
              className="btn-press px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <Check className="w-4 h-4" />
              <span>
                {isImporting
                  ? 'Importing Data...'
                  : `Import ${parsedPreview.rows.length} ${activeConfig.titleEn} Now`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
