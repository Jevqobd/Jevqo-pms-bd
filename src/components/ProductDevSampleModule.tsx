/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ProductSample,
  SampleStage,
  ColorSwatchRecipe,
  BomCostItem,
  Order,
  UserRole,
} from '../types/erp';
import { Language } from '../utils/translations';
import { useFormDraft } from '../utils/useFormDraft';
import { NavTab } from './Sidebar';
import {
  FlaskConical,
  Plus,
  Layers,
  CheckCircle2,
  ArrowRight,
  Printer,
  Palette,
  Calculator,
  Sparkles,
  Flame,
  Ruler,
  ShieldCheck,
  Rocket,
  RotateCcw,
  X,
  FileSpreadsheet,
  Shirt,
  Scissors,
  Gauge,
  Award,
} from 'lucide-react';

interface ProductDevSampleModuleProps {
  samples: ProductSample[];
  colorSwatches: ColorSwatchRecipe[];
  currentRole: UserRole;
  language: Language;
  onCreateSample: (sample: ProductSample) => void;
  onUpdateSample: (id: string, updates: Partial<ProductSample>) => void;
  onCreateColorSwatch: (swatch: ColorSwatchRecipe) => void;
  onConvertSampleToOrder: (sample: ProductSample, bulkQty: number) => void;
  onNavigateTab?: (tab: NavTab) => void;
}

const SAMPLE_STAGE_META: {
  id: SampleStage;
  label: string;
  shortDesc: string;
  badgeClass: string;
}[] = [
  {
    id: 'concept_techpack',
    label: '1. Concept & Tech Pack',
    shortDesc: 'Silhouette, GSM & BOM spec sheet',
    badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
  },
  {
    id: 'cad_3d_pattern',
    label: '2. CAD & 3D Pattern',
    shortDesc: 'CLO3D / Gerber grading & marker',
    badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  },
  {
    id: 'proto_sample',
    label: '3. First Proto Sample',
    shortDesc: 'Test sublimation & flatlock stitch',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  },
  {
    id: 'fit_wear_test',
    label: '4. Athlete Fit & Wash Test',
    shortDesc: 'Mobility, shrinkage & sweat-wicking',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  {
    id: 'pp_sample',
    label: '5. Golden PP Sample',
    shortDesc: 'Pre-production reference sealed',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  },
  {
    id: 'approved_for_bulk',
    label: '6. Approved for Bulk',
    shortDesc: 'Ready for 1-click Job Card launch',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
];

const INITIAL_SAMPLE_DRAFT = {
  styleName: '',
  category: 'Football Kit' as ProductSample['category'],
  seasonOrCollection: 'Spring/Summer Tournament 2026',
  clientOrBrand: '',
  fabricSpec: '160 GSM Micro-Eyelet Breathable Poly + Mesh Side Panels',
  gsm: 160,
  collarType: 'Pro Ribbed V-Neck Collar',
  fitType: 'Athletic Pro Fit' as ProductSample['fitType'],
  heatPressTempC: 205,
  heatPressTimeSec: 35,
  shrinkageWarpPct: 1.4,
  shrinkageWeftPct: 1.1,
  fabricYieldMetersPerPc: 1.35,
  fabricRatePerMeter: 2.8,
  inkPaperCostPerPc: 1.5,
  trimsCostPerPc: 1.35,
  smvMinutes: 14,
  smvRatePerMin: 0.12,
  targetWholesalePrice: 16.5,
  targetRetailPrice: 28.0,
  chestCm: 52,
  lengthCm: 73,
  sleeveCm: 38,
  toleranceCm: 0.8,
  designerName: 'Nusrat Jahan',
  patternMasterName: 'Sharif Ahmed',
  statusNotes: 'Initial Tech Pack & BOM costing prepared for proto sample run.',
};

const INITIAL_SWATCH_DRAFT = {
  colorName: '',
  pantoneCode: 'PANTONE 354 C',
  hexPreview: '#10b981',
  c: 85,
  m: 0,
  y: 92,
  k: 0,
  targetFabric: 'Micro-Eyelet 160 GSM',
  gsm: 160,
  pressTempC: 205,
  pressSeconds: 35,
  deltaEScore: 0.75,
  labNotes: 'Tested on Tongi rotary calendar heat press at 4 bar pressure.',
};

export const ProductDevSampleModule: React.FC<ProductDevSampleModuleProps> = ({
  samples,
  colorSwatches,
  language,
  onCreateSample,
  onUpdateSample,
  onCreateColorSwatch,
  onConvertSampleToOrder,
  onNavigateTab,
}) => {
  const [activeTab, setActiveTab] = useState<
    'samples_pipeline' | 'bom_costing' | 'color_lab' | 'brand_os_blueprint'
  >('samples_pipeline');

  const [isNewSampleOpen, setIsNewSampleOpen] = useState(false);
  const [isNewSwatchOpen, setIsNewSwatchOpen] = useState(false);
  const [selectedTechPack, setSelectedTechPack] = useState<ProductSample | null>(null);
  const [bulkConvertSample, setBulkConvertSample] = useState<ProductSample | null>(null);
  const [bulkOrderQty, setBulkOrderQty] = useState<number>(40);

  // Interactive Roll Nesting & AQL QC Simulator states in Blueprint tab
  const [nestingOrderQty, setNestingOrderQty] = useState<number>(60);
  const [nestingGsm, setNestingGsm] = useState<number>(160);
  const [nestingIncludeShorts, setNestingIncludeShorts] = useState<boolean>(true);
  const [aqlBatchSize, setAqlBatchSize] = useState<number>(120);

  // Auto-draft hooks
  const {
    draft: sampleDraft,
    updateField: updateSampleField,
    clearDraft: clearSampleDraft,
    hasSavedDraft: hasSampleDraft,
    lastSavedAt: sampleSavedAt,
  } = useFormDraft('npd_sample_techpack_entry', INITIAL_SAMPLE_DRAFT);

  const {
    draft: swatchDraft,
    updateField: updateSwatchField,
    clearDraft: clearSwatchDraft,
    hasSavedDraft: hasSwatchDraft,
    lastSavedAt: swatchSavedAt,
  } = useFormDraft('sublimation_color_swatch_entry', INITIAL_SWATCH_DRAFT);

  // Live BOM Costing calculation for the draft form
  const draftCostBreakdown = useMemo(() => {
    const fabricCost = Number(
      (sampleDraft.fabricYieldMetersPerPc * sampleDraft.fabricRatePerMeter).toFixed(2)
    );
    const inkCost = Number(sampleDraft.inkPaperCostPerPc.toFixed(2));
    const trimsCost = Number(sampleDraft.trimsCostPerPc.toFixed(2));
    const laborCost = Number((sampleDraft.smvMinutes * sampleDraft.smvRatePerMin).toFixed(2));
    const qcPackCost = 0.4;
    const totalUnitCost = Number(
      (fabricCost + inkCost + trimsCost + laborCost + qcPackCost).toFixed(2)
    );
    const marginPct =
      sampleDraft.targetWholesalePrice > 0
        ? Number(
            (
              ((sampleDraft.targetWholesalePrice - totalUnitCost) /
                sampleDraft.targetWholesalePrice) *
              100
            ).toFixed(1)
          )
        : 0;
    return {
      fabricCost,
      inkCost,
      trimsCost,
      laborCost,
      qcPackCost,
      totalUnitCost,
      marginPct,
    };
  }, [sampleDraft]);

  // Live 1.6m Sublimation Roll Nesting & Yield Calculator
  const rollNestingMetrics = useMemo(() => {
    const baseMetersPerJersey = 1.28;
    const shortsMeters = nestingIncludeShorts ? 0.68 : 0;
    const rawMetersNeeded = nestingOrderQty * (baseMetersPerJersey + shortsMeters);
    const markerEfficiencyPct = nestingOrderQty >= 50 ? 89.5 : 84.2;
    const nestedRollLengthMeters = Number(
      (rawMetersNeeded / (markerEfficiencyPct / 100)).toFixed(1)
    );
    const fabricWeightKg = Number(
      ((nestedRollLengthMeters * 1.6 * nestingGsm) / 1000).toFixed(2)
    );
    const inkConsumptionMl = Math.round(nestedRollLengthMeters * 14.5);
    return {
      nestedRollLengthMeters,
      markerEfficiencyPct,
      fabricWeightKg,
      inkConsumptionMl,
    };
  }, [nestingOrderQty, nestingGsm, nestingIncludeShorts]);

  // Live AQL 2.5 Quality Inspection Sampling Calculator
  const aqlMetrics = useMemo(() => {
    let sampleSize = 13;
    let maxMajorDefects = 1;
    let maxMinorDefects = 2;
    if (aqlBatchSize <= 25) {
      sampleSize = 5;
      maxMajorDefects = 0;
      maxMinorDefects = 1;
    } else if (aqlBatchSize <= 50) {
      sampleSize = 8;
      maxMajorDefects = 0;
      maxMinorDefects = 1;
    } else if (aqlBatchSize <= 90) {
      sampleSize = 13;
      maxMajorDefects = 1;
      maxMinorDefects = 2;
    } else if (aqlBatchSize <= 150) {
      sampleSize = 20;
      maxMajorDefects = 1;
      maxMinorDefects = 3;
    } else if (aqlBatchSize <= 280) {
      sampleSize = 32;
      maxMajorDefects = 2;
      maxMinorDefects = 5;
    } else {
      sampleSize = 50;
      maxMajorDefects = 3;
      maxMinorDefects = 7;
    }
    return { sampleSize, maxMajorDefects, maxMinorDefects };
  }, [aqlBatchSize]);

  const handleAdvanceSampleStage = (sample: ProductSample) => {
    const orderIdx = SAMPLE_STAGE_META.findIndex((s) => s.id === sample.stage);
    if (orderIdx === -1 || orderIdx >= SAMPLE_STAGE_META.length - 1) return;
    const nextStage = SAMPLE_STAGE_META[orderIdx + 1].id;
    const nextVersion =
      nextStage === 'proto_sample'
        ? 'V1 Proto'
        : nextStage === 'fit_wear_test'
        ? 'V2 Fit Revision'
        : nextStage === 'pp_sample' || nextStage === 'approved_for_bulk'
        ? 'V3 Golden PP Sample'
        : sample.sampleVersion;

    onUpdateSample(sample.id, {
      stage: nextStage,
      sampleVersion: nextVersion,
    });
  };

  const handleCreateNewSample = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sampleDraft.styleName.trim()) return;

    const bomItems: BomCostItem[] = [
      {
        id: `bom-fab-${Date.now()}`,
        componentName: sampleDraft.fabricSpec,
        category: 'Fabric',
        consumptionPerPc: sampleDraft.fabricYieldMetersPerPc,
        unit: 'meters',
        ratePerUnit: sampleDraft.fabricRatePerMeter,
        costPerPc: draftCostBreakdown.fabricCost,
      },
      {
        id: `bom-ink-${Date.now()}`,
        componentName: '90 GSM Transfer Paper + High-Density CMYK Sublimation Ink',
        category: 'Sublimation Paper & Ink',
        consumptionPerPc: sampleDraft.fabricYieldMetersPerPc,
        unit: 'meters',
        ratePerUnit: Number(
          (sampleDraft.inkPaperCostPerPc / sampleDraft.fabricYieldMetersPerPc).toFixed(2)
        ),
        costPerPc: draftCostBreakdown.inkCost,
      },
      {
        id: `bom-trm-${Date.now()}`,
        componentName: `${sampleDraft.collarType} + Labels & Crest`,
        category: 'Trims & Labels',
        consumptionPerPc: 1,
        unit: 'set',
        ratePerUnit: sampleDraft.trimsCostPerPc,
        costPerPc: draftCostBreakdown.trimsCost,
      },
      {
        id: `bom-sew-${Date.now()}`,
        componentName: `Mirpur Sewing Line (${sampleDraft.smvMinutes} SMV Mins)`,
        category: 'Sewing SMV Labor',
        consumptionPerPc: sampleDraft.smvMinutes,
        unit: 'mins',
        ratePerUnit: sampleDraft.smvRatePerMin,
        costPerPc: draftCostBreakdown.laborCost,
      },
      {
        id: `bom-qc-${Date.now()}`,
        componentName: 'AQL 2.5 QC Steam Finish & Polybag',
        category: 'Packaging & QC',
        consumptionPerPc: 1,
        unit: 'pc',
        ratePerUnit: draftCostBreakdown.qcPackCost,
        costPerPc: draftCostBreakdown.qcPackCost,
      },
    ];

    const newSample: ProductSample = {
      id: `smp-${Date.now()}`,
      techPackCode: `TP-2026-0${samples.length + 4}`,
      styleName: sampleDraft.styleName.trim(),
      category: sampleDraft.category,
      seasonOrCollection: sampleDraft.seasonOrCollection,
      clientOrBrand: sampleDraft.clientOrBrand.trim() || 'Ridwear Pro Collection',
      fabricSpec: sampleDraft.fabricSpec,
      gsm: Number(sampleDraft.gsm) || 160,
      collarType: sampleDraft.collarType,
      fitType: sampleDraft.fitType,
      stage: 'concept_techpack',
      sampleVersion: 'V1 Concept',
      heatPressTempC: Number(sampleDraft.heatPressTempC) || 205,
      heatPressTimeSec: Number(sampleDraft.heatPressTimeSec) || 35,
      shrinkageWarpPct: Number(sampleDraft.shrinkageWarpPct) || 1.4,
      shrinkageWeftPct: Number(sampleDraft.shrinkageWeftPct) || 1.1,
      washFastnessGrade: 'Grade 4.8 / 5.0',
      fabricYieldMetersPerPc: Number(sampleDraft.fabricYieldMetersPerPc) || 1.35,
      bomItems,
      unitProductionCost: draftCostBreakdown.totalUnitCost,
      targetWholesalePrice: Number(sampleDraft.targetWholesalePrice) || 16.5,
      targetRetailPrice: Number(sampleDraft.targetRetailPrice) || 28.0,
      estimatedMarginPct: draftCostBreakdown.marginPct,
      measurements: {
        chestCm: Number(sampleDraft.chestCm) || 52,
        lengthCm: Number(sampleDraft.lengthCm) || 73,
        sleeveCm: Number(sampleDraft.sleeveCm) || 38,
        toleranceCm: Number(sampleDraft.toleranceCm) || 0.8,
      },
      designerName: sampleDraft.designerName,
      patternMasterName: sampleDraft.patternMasterName,
      statusNotes: sampleDraft.statusNotes,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onCreateSample(newSample);
    clearSampleDraft();
    setIsNewSampleOpen(false);
  };

  const handleCreateSwatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!swatchDraft.colorName.trim()) return;

    const newSwatch: ColorSwatchRecipe = {
      id: `clr-${Date.now()}`,
      swatchCode: `LAB-SW-2026-0${colorSwatches.length + 1}`,
      colorName: swatchDraft.colorName.trim(),
      pantoneCode: swatchDraft.pantoneCode,
      hexPreview: swatchDraft.hexPreview,
      cmykRecipe: {
        c: Number(swatchDraft.c),
        m: Number(swatchDraft.m),
        y: Number(swatchDraft.y),
        k: Number(swatchDraft.k),
      },
      targetFabric: swatchDraft.targetFabric,
      gsm: Number(swatchDraft.gsm),
      pressTempC: Number(swatchDraft.pressTempC),
      pressSeconds: Number(swatchDraft.pressSeconds),
      deltaEScore: Number(swatchDraft.deltaEScore),
      status: Number(swatchDraft.deltaEScore) <= 1.0 ? 'approved' : 'testing',
      labNotes: swatchDraft.labNotes,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onCreateColorSwatch(newSwatch);
    clearSwatchDraft();
    setIsNewSwatchOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <FlaskConical className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-black text-white tracking-tight">
              {language === 'bn'
                ? 'নতুন পণ্য উন্নয়ন (NPD), টেক-প্যাক ও স্যাম্পল ম্যানেজমেন্ট ল্যাব'
                : 'New Product Development (NPD), Tech Pack & Sample Management Lab'}
            </h2>
            <p className="text-xs text-slate-400">
              End-to-end Sportswear R&amp;D: Tech Packs, BOM Unit Costing, Proto/Fit/Golden PP Samples, Sublimation Color Lab &amp; 1-Click Bulk Job Card Launch
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsNewSwatchOpen(true)}
            className="btn-press flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition cursor-pointer"
          >
            <Palette className="w-4 h-4 text-cyan-400" />
            <span>Log Color Swatch Recipe</span>
            {hasSwatchDraft && (
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-500/20 text-amber-300 font-mono">
                Draft
              </span>
            )}
          </button>

          <button
            onClick={() => setIsNewSampleOpen(true)}
            className="btn-press flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Tech Pack &amp; Sample</span>
            {hasSampleDraft && (
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-black/30 text-amber-200 font-mono">
                Draft
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Sub-Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('samples_pipeline')}
          className={`btn-press px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'samples_pipeline'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-slate-900/70 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Sample Lifecycle &amp; Tech Packs ({samples.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bom_costing')}
          className={`btn-press px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'bom_costing'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-slate-900/70 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>BOM Costing &amp; Margin Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('color_lab')}
          className={`btn-press px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'color_lab'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-slate-900/70 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Sublimation Color Lab &amp; Pantone Recipes ({colorSwatches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('brand_os_blueprint')}
          className={`btn-press px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'brand_os_blueprint'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              : 'bg-slate-900/70 text-indigo-300 hover:text-white border border-indigo-500/30'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Sportswear Brand OS — Pro Tools &amp; Architecture Blueprint</span>
        </button>
      </div>

      {/* TAB 1: SAMPLE LIFECYCLE PIPELINE */}
      {activeTab === 'samples_pipeline' && (
        <div className="space-y-5">
          {/* 6-Gate Lifecycle Progress Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {SAMPLE_STAGE_META.map((stageMeta) => {
              const count = samples.filter((s) => s.stage === stageMeta.id).length;
              return (
                <div
                  key={stageMeta.id}
                  className="bg-[#0a0f1d] border border-slate-800 rounded-xl p-3 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white">{stageMeta.label}</span>
                    <span className="text-xs font-mono font-black px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-slate-800 tabular-nums">
                      {count}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{stageMeta.shortDesc}</p>
                </div>
              );
            })}
          </div>

          {/* Sample Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {samples.map((sample) => {
              const stageMeta =
                SAMPLE_STAGE_META.find((s) => s.id === sample.stage) || SAMPLE_STAGE_META[0];
              const isApproved = sample.stage === 'approved_for_bulk';

              return (
                <div
                  key={sample.id}
                  className="bg-[#0a0f1d] border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between gap-4 transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-slate-800">
                            {sample.techPackCode}
                          </span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                            {sample.sampleVersion}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-white mt-1.5">
                          {sample.styleName}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {sample.clientOrBrand} • {sample.seasonOrCollection}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border whitespace-nowrap ${stageMeta.badgeClass}`}
                      >
                        {stageMeta.label}
                      </span>
                    </div>

                    {/* Technical Fabric & Sublimation Parameters */}
                    <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-900/75 border border-slate-800/90 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Fabric &amp; GSM</span>
                        <span className="text-white font-semibold truncate block">
                          {sample.gsm} GSM • {sample.fitType}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">
                          Heat Press Transfer
                        </span>
                        <span className="text-amber-300 font-mono font-bold tabular-nums">
                          {sample.heatPressTempC}°C @ {sample.heatPressTimeSec}s
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">
                          Shrinkage (Warp/Weft)
                        </span>
                        <span className="text-cyan-300 font-mono tabular-nums">
                          -{sample.shrinkageWarpPct}% / -{sample.shrinkageWeftPct}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">
                          Fabric Yield / Pc
                        </span>
                        <span className="text-emerald-400 font-mono font-bold tabular-nums">
                          {sample.fabricYieldMetersPerPc}m / pc
                        </span>
                      </div>
                    </div>

                    {/* Costing & Margin Bar */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-center font-mono tabular-nums">
                      <div>
                        <span className="text-[10px] text-slate-400 block">BOM Unit Cost</span>
                        <span className="text-xs font-bold text-white">
                          ${sample.unitProductionCost.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">B2B Wholesale</span>
                        <span className="text-xs font-bold text-emerald-400">
                          ${sample.targetWholesalePrice.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Gross Margin</span>
                        <span className="text-xs font-bold text-indigo-400">
                          {sample.estimatedMarginPct}%
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60">
                      {sample.statusNotes}
                    </p>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedTechPack(sample)}
                      className="btn-press px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Tech Pack &amp; BOM</span>
                    </button>

                    {!isApproved ? (
                      <button
                        onClick={() => handleAdvanceSampleStage(sample)}
                        className="btn-press px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1"
                      >
                        <span>Advance Stage</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setBulkConvertSample(sample);
                          setBulkOrderQty(40);
                        }}
                        className="btn-press px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/50 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Rocket className="w-3.5 h-3.5" />
                        <span>Convert to Bulk Job Card</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: BOM COSTING & MARGIN MATRIX */}
      {activeTab === 'bom_costing' && (
        <div className="space-y-4">
          {samples.map((sample) => (
            <div
              key={sample.id}
              className="bg-[#0a0f1d] border border-slate-800 rounded-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {sample.techPackCode}
                    </span>
                    <h3 className="text-sm font-black text-white">{sample.styleName}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Fabric Spec: {sample.fabricSpec} • Collar: {sample.collarType}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Unit Cost</span>
                    <span className="text-white font-black">
                      ${sample.unitProductionCost.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Wholesale</span>
                    <span className="text-emerald-400 font-black">
                      ${sample.targetWholesalePrice.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Retail MSRP</span>
                    <span className="text-cyan-400 font-black">
                      ${sample.targetRetailPrice.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Gross Margin</span>
                    <span className="text-indigo-400 font-black">
                      {sample.estimatedMarginPct}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-400 bg-slate-900/30">
                      <th className="py-2.5 px-4">BOM Cost Category</th>
                      <th className="py-2.5 px-4">Material / Operation Description</th>
                      <th className="py-2.5 px-4 text-right">Consumption / Pc</th>
                      <th className="py-2.5 px-4 text-right">Rate</th>
                      <th className="py-2.5 px-4 text-right">Cost / Jersey</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {sample.bomItems.map((bom) => (
                      <tr key={bom.id} className="hover:bg-slate-900/30">
                        <td className="py-2.5 px-4 font-semibold text-indigo-300">
                          {bom.category}
                        </td>
                        <td className="py-2.5 px-4 text-slate-200">{bom.componentName}</td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-300">
                          {bom.consumptionPerPc} {bom.unit}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-400">
                          ${bom.ratePerUnit.toFixed(2)}/{bom.unit}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold tabular-nums text-emerald-400">
                          ${bom.costPerPc.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: SUBLIMATION COLOR LAB & PANTONE RECIPES */}
      {activeTab === 'color_lab' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {colorSwatches.map((swatch) => (
            <div
              key={swatch.id}
              className="bg-[#0a0f1d] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl border border-white/20 shrink-0 shadow-inner"
                    style={{ backgroundColor: swatch.hexPreview }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-slate-800">
                        {swatch.pantoneCode}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          swatch.status === 'approved'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {swatch.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-white mt-1">{swatch.colorName}</h4>
                  </div>
                </div>

                {/* CMYK Recipe Channels */}
                <div className="grid grid-cols-4 gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center font-mono text-xs tabular-nums">
                  <div>
                    <span className="text-[10px] text-cyan-400 block font-bold">C</span>
                    <span className="text-white font-black">{swatch.cmykRecipe.c}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-pink-400 block font-bold">M</span>
                    <span className="text-white font-black">{swatch.cmykRecipe.m}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-300 block font-bold">Y</span>
                    <span className="text-white font-black">{swatch.cmykRecipe.y}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">K</span>
                    <span className="text-white font-black">{swatch.cmykRecipe.k}%</span>
                  </div>
                </div>

                {/* Press Profile & Delta-E */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono tabular-nums bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Target Fabric</span>
                    <span className="text-slate-200 font-sans font-semibold">
                      {swatch.targetFabric}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Rotary Press</span>
                    <span className="text-amber-300 font-bold">
                      {swatch.pressTempC}°C @ {swatch.pressSeconds}s
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Delta-E Accuracy</span>
                    <span className="text-emerald-400 font-bold">
                      ΔE {swatch.deltaEScore} (Pass &lt; 1.0)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Swatch ID</span>
                    <span className="text-slate-300">{swatch.swatchCode}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400">{swatch.labNotes}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: SPORTSWEAR BRAND OS — PRO TOOLS & ARCHITECTURE BLUEPRINT */}
      {activeTab === 'brand_os_blueprint' && (
        <div className="space-y-6">
          {/* Interactive Pro Calculators Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calculator 1: 1.6m Sublimation Roll Nesting & Fabric Yield Optimizer */}
            <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <Ruler className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-white">
                      1.6m Sublimation Roll Nesting &amp; Yield Calculator
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Calculates exact Tongi paper/fabric roll length, kg weight &amp; ink usage before printing
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">
                    Order Quantity (Sets)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={nestingOrderQty}
                    onChange={(e) => setNestingOrderQty(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">
                    Fabric Density (GSM)
                  </label>
                  <select
                    value={nestingGsm}
                    onChange={(e) => setNestingGsm(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  >
                    <option value={130}>130 GSM (Marathon FeatherPoly)</option>
                    <option value={150}>150 GSM (Dot Mesh)</option>
                    <option value={160}>160 GSM (Micro-Eyelet Standard)</option>
                    <option value={180}>180 GSM (Heavy Poly Interlock)</option>
                    <option value={210}>210 GSM (Tracksuit Tricot)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">
                    Kit Configuration
                  </label>
                  <button
                    type="button"
                    onClick={() => setNestingIncludeShorts(!nestingIncludeShorts)}
                    className={`w-full py-2 px-3 rounded-xl font-bold border transition cursor-pointer ${
                      nestingIncludeShorts
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    {nestingIncludeShorts ? 'Full Kit (Jersey + Shorts)' : 'Top Jersey Only'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-mono tabular-nums">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">1.6m Roll Length</span>
                  <span className="text-base font-black text-emerald-400">
                    {rollNestingMetrics.nestedRollLengthMeters} m
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Marker Efficiency</span>
                  <span className="text-base font-black text-cyan-400">
                    {rollNestingMetrics.markerEfficiencyPct}%
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Blank Roll Weight</span>
                  <span className="text-base font-black text-white">
                    {rollNestingMetrics.fabricWeightKg} kg
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Est. CMYK Ink</span>
                  <span className="text-base font-black text-indigo-400">
                    {rollNestingMetrics.inkConsumptionMl} ml
                  </span>
                </div>
              </div>
            </div>

            {/* Calculator 2: AQL 2.5 Quality Control Gate & Defect Tolerance Matrix */}
            <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-white">
                      AQL 2.5 Sportswear Quality Control (QC) Gate
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      ISO 2859-1 statistical garment inspection calculator for Mirpur Sewing Finishing Line
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex-1">
                  <label className="block text-slate-400 mb-1 font-semibold">
                    Total Production Lot / Batch Size (Pieces)
                  </label>
                  <input
                    type="number"
                    min={2}
                    value={aqlBatchSize}
                    onChange={(e) => setAqlBatchSize(Math.max(2, Number(e.target.value)))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center font-mono tabular-nums">
                  <span className="text-[10px] text-slate-400 block">Pull Sample Size</span>
                  <span className="text-lg font-black text-emerald-400">
                    {aqlMetrics.sampleSize} Pcs
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center font-mono tabular-nums">
                  <span className="text-[10px] text-slate-400 block">Pass / Reject Limit</span>
                  <span className="text-lg font-black text-amber-400">
                    ≤ {aqlMetrics.maxMajorDefects} Major
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Zero Sublimation Ghosting / Double-Edge Blur</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Player Roster Name &amp; Number 100% Match</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>4-Thread Overlock Seam Stretch Test Passed</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Chest/Length Measurement within ±0.8cm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Complete Sportswear Brand OS Architecture & Suggested Upgrades Grid */}
          <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl p-6 space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold mb-2">
                <Award className="w-3.5 h-3.5" />
                <span>END-TO-END SPORTSWEAR BRAND OPERATING SYSTEM ARCHITECTURE</span>
              </div>
              <h3 className="text-base font-black text-white">
                High-Impact Sportswear Brand Capabilities Integrated Across Your ERP
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Every critical module required to scale a custom sublimation &amp; athletic apparel brand from initial design concept to repeat club sponsorships:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-400">
                      1. Tech Pack, GSM Yield &amp; BOM Engine
                    </span>
                    <FlaskConical className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    Eliminates guesswork on jersey margins by calculating exact fabric meters per piece, sublimation ink/paper coverage, collar trims, and Mirpur sewing SMV minutes before quoting a club.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('bom_costing')}
                  className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Open BOM Costing Matrix</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-cyan-400">
                      2. Sublimation Color Lab &amp; Shrinkage Registry
                    </span>
                    <Flame className="w-4 h-4 text-cyan-400" />
                  </div>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    Stores Pantone-to-CMYK ink formulas, rotary calendar press temperatures (205°C @ 35s), and fabric warp/weft shrinkage % so repeat club orders match colors 100% across seasons.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('color_lab')}
                  className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Color Swatch Lab</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-400">
                      3. Vendor PO, GRN &amp; Auto-Stock Sync
                    </span>
                    <Gauge className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    Connects fabric mills &amp; ink suppliers directly to Tongi &amp; Mirpur inventory. Receiving a Goods Received Note (GRN) automatically increments raw stock and updates the Vendor Payable Ledger.
                  </p>
                </div>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('vendors_suppliers')}
                    className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Go to Vendors &amp; PO/GRN Hub</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-400">
                      4. QR Fabric Bundle Tagging &amp; Floor Scan
                    </span>
                    <Shirt className="w-4 h-4 text-indigo-400" />
                  </div>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    Prints unique QR bundle tags for sublimated rolls leaving Tongi Print Mill so Mirpur Sewing operators scan and pull up player rosters, collar specs, and size breakdowns immediately.
                  </p>
                </div>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('orders')}
                    className="text-xs font-bold text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Go to Job Cards &amp; QR Pipeline</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-rose-400">
                      5. Express Shortage &amp; Damaged Panel Loop
                    </span>
                    <Scissors className="w-4 h-4 text-rose-400" />
                  </div>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    When a single panel (e.g., Player #9 Size L Front Panel) is scorched or miscut during sewing, triggers a red-alert ticket to Pre-Press &amp; Tongi Print to re-print just that piece in 45 minutes.
                  </p>
                </div>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('shortages')}
                    className="text-xs font-bold text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open Priority Shortage Loop</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-400">
                      6. B2B Club Loyalty Privilege &amp; Roster Re-Orders
                    </span>
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </div>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    Tracks customer returning ratios, privilege stars (Silver/Gold/Platinum VIP), and portal access codes so sports academies can approve estimates, view ledgers, and order extra kits for new signings.
                  </p>
                </div>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('customers_crm')}
                    className="text-xs font-bold text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open VIP Customer Directory</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE NEW TECH PACK & SAMPLE (WITH AUTO-DRAFT) */}
      {isNewSampleOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">
                  Create New Sportswear Tech Pack &amp; Sample Request
                </h3>
                {sampleSavedAt && (
                  <p className="text-[11px] text-emerald-400 font-mono">
                    Auto-saved in draft at {sampleSavedAt}
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsNewSampleOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewSample} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Style / Kit Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={sampleDraft.styleName}
                    onChange={(e) => updateSampleField('styleName', e.target.value)}
                    placeholder="e.g. ProLaser Mesh Football Kit 2026"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Apparel Category
                  </label>
                  <select
                    value={sampleDraft.category}
                    onChange={(e) =>
                      updateSampleField(
                        'category',
                        e.target.value as ProductSample['category']
                      )
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Football Kit">Football Kit</option>
                    <option value="Cricket Jersey">Cricket Jersey</option>
                    <option value="Basketball Uniform">Basketball Uniform</option>
                    <option value="Marathon Singlet">Marathon Singlet</option>
                    <option value="Esports Pro Jersey">Esports Pro Jersey</option>
                    <option value="Tracksuit / Warmup">Tracksuit / Warmup</option>
                    <option value="Training Shorts">Training Shorts</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Client / Brand Line
                  </label>
                  <input
                    type="text"
                    value={sampleDraft.clientOrBrand}
                    onChange={(e) => updateSampleField('clientOrBrand', e.target.value)}
                    placeholder="Abahani Youth Academy / Ridwear Pro"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Collar Construction
                  </label>
                  <input
                    type="text"
                    value={sampleDraft.collarType}
                    onChange={(e) => updateSampleField('collarType', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">GSM</label>
                  <input
                    type="number"
                    value={sampleDraft.gsm}
                    onChange={(e) => updateSampleField('gsm', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Press Temp (°C)
                  </label>
                  <input
                    type="number"
                    value={sampleDraft.heatPressTempC}
                    onChange={(e) =>
                      updateSampleField('heatPressTempC', Number(e.target.value))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Dwell Time (s)
                  </label>
                  <input
                    type="number"
                    value={sampleDraft.heatPressTimeSec}
                    onChange={(e) =>
                      updateSampleField('heatPressTimeSec', Number(e.target.value))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Yield (Meters/Pc)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={sampleDraft.fabricYieldMetersPerPc}
                    onChange={(e) =>
                      updateSampleField('fabricYieldMetersPerPc', Number(e.target.value))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Fabric Rate ($/m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={sampleDraft.fabricRatePerMeter}
                    onChange={(e) =>
                      updateSampleField('fabricRatePerMeter', Number(e.target.value))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Ink &amp; Paper ($/pc)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={sampleDraft.inkPaperCostPerPc}
                    onChange={(e) =>
                      updateSampleField('inkPaperCostPerPc', Number(e.target.value))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Sewing SMV (Mins)
                  </label>
                  <input
                    type="number"
                    value={sampleDraft.smvMinutes}
                    onChange={(e) => updateSampleField('smvMinutes', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Wholesale Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={sampleDraft.targetWholesalePrice}
                    onChange={(e) =>
                      updateSampleField('targetWholesalePrice', Number(e.target.value))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              {/* Live Calculated Unit Cost Summary */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-2 font-mono">
                <span className="text-slate-400">
                  Calculated BOM Unit Cost:{' '}
                  <strong className="text-white">${draftCostBreakdown.totalUnitCost}</strong>
                </span>
                <span className="text-emerald-400 font-bold">
                  Est. Wholesale Margin: {draftCostBreakdown.marginPct}%
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    clearSampleDraft();
                    setIsNewSampleOpen(false);
                  }}
                  className="btn-press px-3 py-2 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Discard Draft</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewSampleOpen(false)}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                  >
                    Keep Draft
                  </button>
                  <button
                    type="submit"
                    className="btn-press px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  >
                    Create Tech Pack &amp; Sample
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE SUBLIMATION COLOR SWATCH RECIPE */}
      {isNewSwatchOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">
                  Log Sublimation Color Swatch &amp; Pantone Recipe
                </h3>
                {swatchSavedAt && (
                  <p className="text-[11px] text-emerald-400 font-mono">
                    Auto-saved in draft at {swatchSavedAt}
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsNewSwatchOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSwatch} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Color Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={swatchDraft.colorName}
                    onChange={(e) => updateSwatchField('colorName', e.target.value)}
                    placeholder="e.g. Royal Bengal Gold"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Pantone Reference
                  </label>
                  <input
                    type="text"
                    value={swatchDraft.pantoneCode}
                    onChange={(e) => updateSwatchField('pantoneCode', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Hex</label>
                  <input
                    type="color"
                    value={swatchDraft.hexPreview}
                    onChange={(e) => updateSwatchField('hexPreview', e.target.value)}
                    className="w-full h-9 bg-slate-900 border border-slate-800 rounded-xl p-1"
                  />
                </div>
                <div>
                  <label className="block text-cyan-400 font-bold mb-1">C (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={swatchDraft.c}
                    onChange={(e) => updateSwatchField('c', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-pink-400 font-bold mb-1">M (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={swatchDraft.m}
                    onChange={(e) => updateSwatchField('m', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-amber-300 font-bold mb-1">Y (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={swatchDraft.y}
                    onChange={(e) => updateSwatchField('y', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">K (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={swatchDraft.k}
                    onChange={(e) => updateSwatchField('k', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Press Temp (°C)
                  </label>
                  <input
                    type="number"
                    value={swatchDraft.pressTempC}
                    onChange={(e) => updateSwatchField('pressTempC', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Dwell (Sec)
                  </label>
                  <input
                    type="number"
                    value={swatchDraft.pressSeconds}
                    onChange={(e) =>
                      updateSwatchField('pressSeconds', Number(e.target.value))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Delta-E Score
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={swatchDraft.deltaEScore}
                    onChange={(e) =>
                      updateSwatchField('deltaEScore', Number(e.target.value))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    clearSwatchDraft();
                    setIsNewSwatchOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold"
                >
                  Discard Draft
                </button>
                <button
                  type="submit"
                  className="btn-press px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold"
                >
                  Save Swatch Recipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PRINTABLE TECH PACK SPEC SHEET */}
      {selectedTechPack && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  OFFICIAL SPORTSWEAR TECH PACK &amp; BOM SHEET
                </span>
                <h3 className="text-lg font-black text-white">
                  {selectedTechPack.techPackCode} — {selectedTechPack.styleName}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="btn-press px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Spec Sheet</span>
                </button>
                <button
                  onClick={() => setSelectedTechPack(null)}
                  className="p-1.5 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-900 p-3.5 rounded-xl border border-slate-800 font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">Chest (Size L)</span>
                <span className="text-white font-bold">
                  {selectedTechPack.measurements.chestCm} cm
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Body Length</span>
                <span className="text-white font-bold">
                  {selectedTechPack.measurements.lengthCm} cm
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Sleeve Length</span>
                <span className="text-white font-bold">
                  {selectedTechPack.measurements.sleeveCm} cm
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">QC Tolerance</span>
                <span className="text-emerald-400 font-bold">
                  ±{selectedTechPack.measurements.toleranceCm} cm
                </span>
              </div>
            </div>

            <table className="w-full text-left text-xs border border-slate-800">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Component</th>
                  <th className="p-2.5 text-right">Consumption</th>
                  <th className="p-2.5 text-right">Cost / Pc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {selectedTechPack.bomItems.map((b) => (
                  <tr key={b.id}>
                    <td className="p-2.5 text-white">{b.componentName}</td>
                    <td className="p-2.5 text-right font-mono text-slate-300">
                      {b.consumptionPerPc} {b.unit}
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-emerald-400">
                      ${b.costPerPc.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 4: 1-CLICK CONVERT APPROVED SAMPLE TO BULK JOB CARD */}
      {bulkConvertSample && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">
                  1-Click Sample → Bulk Production
                </span>
                <h3 className="text-base font-black text-white">
                  Launch Bulk Job Card from {bulkConvertSample.techPackCode}
                </h3>
              </div>
              <button
                onClick={() => setBulkConvertSample(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                Converts <strong className="text-white">{bulkConvertSample.styleName}</strong>{' '}
                into a live Production Job Card with pre-approved fabric ({bulkConvertSample.gsm}{' '}
                GSM), collar ({bulkConvertSample.collarType}), and B2B wholesale pricing ($
                {bulkConvertSample.targetWholesalePrice}/pc).
              </p>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Bulk Order Quantity (Pieces)
                </label>
                <input
                  type="number"
                  min={12}
                  value={bulkOrderQty}
                  onChange={(e) => setBulkOrderQty(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between font-mono">
                <span className="text-slate-400">Bulk Order Total Value:</span>
                <span className="text-base font-black text-emerald-400">
                  ${(bulkOrderQty * bulkConvertSample.targetWholesalePrice).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setBulkConvertSample(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onConvertSampleToOrder(bulkConvertSample, bulkOrderQty);
                    setBulkConvertSample(null);
                  }}
                  className="btn-press px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span>Create Bulk Job Card</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
