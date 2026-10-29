/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'en' | 'bn';

export interface StageTranslation {
  title: string;
  desc: string;
  actionPrompt: string;
  nextStepName: string;
}

export const TRANSLATIONS = {
  en: {
    // Brand & Header
    brandTitle: 'SPORTSWEAR OS',
    brandSub: 'ENTERPRISE ERP & FACTORY CONTROL',
    searchPlaceholder: 'Search Job ID, team, SKU, client, invoice...',
    soundOn: 'Audio FX Active',
    soundOff: 'Audio FX Muted',
    scanQrBtn: 'Scan QR Tag',
    chatBtn: 'Internal Comms',
    newOrderBtn: 'New Job Card',
    roleSwitcher: 'Switch Role',
    activeRole: 'Active Role',
    locationAll: 'All Facilities',
    locationHq: 'Banani HQ (Sales/Design)',
    locationPrint: 'Tongi Print Mill',
    locationSewing: 'Mirpur Sewing Factory',

    // Left Sidebar Navigation
    navDashboardTasks: 'Dashboard & Tasks',
    navOrders: 'Job Cards & Pipeline',
    navHeadOffice: 'HQ Sales & CRM',
    navPrintFloor: 'Tongi Print Factory',
    navSewingFloor: 'Mirpur Sewing Line',
    navShortages: 'Shortage Re-Prints',
    nav3dStudio: '3D Jersey Studio',
    navMockupStudio: 'AI Mockup Generator',
    navAccounting: 'Accounting & Ledgers',
    navInventory: 'Fabric & Raw Stock',
    navHrPayroll: 'HR, Attendance & Wages',
    navManagersPortal: 'Executive Approvals',
    navEmployeePortal: 'My Workstation',

    // Categories in Sidebar
    catCore: 'Factory Pipeline',
    catDesign: 'Design & Mockups',
    catFinance: 'Finance & Supply',
    catWorkforce: 'Workforce & Portals',

    // Common Actions
    advanceStage: 'Advance Stage',
    completed: 'Completed',
    inProgress: 'In Progress',
    pending: 'Pending',
    raiseShortage: 'Raise Shortage Ticket',
    printQrTag: 'Print QR Tag',
    viewDetails: 'View Details',
    exportPdf: 'Export PDF',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    confirm: 'Confirm',
    urgent: 'Urgent',

    // Attendance Manager Entry
    attendanceTitle: 'Department Attendance Terminal',
    attendanceSubtitle: 'Department Managers: Punch daily attendance, overtime & shift logs for floor workers',
    selectDept: 'Select Department / Facility',
    markAllPresent: '1-Click: Mark All Present',
    present: 'Present',
    late: 'Late',
    absent: 'Absent',
    overtime: 'Overtime',
    shift: 'Shift',
    checkIn: 'Check-In',
    checkOut: 'Check-Out',
    status: 'Status',
    actions: 'Actions',
    todaySummary: 'Today Shift Roster',

    // Dashboard & Tasks Specific
    welcomeBack: 'Enterprise Operations Command',
    taskQueueTitle: 'My Role Task Queue',
    taskQueueSubtitle: 'Immediate actionable orders requiring your department verification or handoff',
    noPendingTasks: 'All tasks up to date! No pending bottlenecks in your workstation queue.',
    quickAdvance: '1-Click Advance',
    activeOrdersCount: 'Active Orders',
    urgentShortagesCount: 'Urgent Re-Prints',
    factoryFloorThroughput: 'Factory Floor Throughput',
    totalRevenue: 'Total Pipeline Value',
    pendingPayments: 'Pending Payments',
    todayClockIns: 'Floor Staff Clocked In',

    // Shortage
    shortageAlertBanner: 'Critical Shortage Re-Print Tickets Pending Floor Action',
    reprintPieces: 'Ruined / Replacement Pieces',
  },
  bn: {
    // Brand & Header
    brandTitle: 'স্পোর্টসওয়্যার ওএস',
    brandSub: 'এন্টারপ্রাইজ ইআরপি ও কারখানা নিয়ন্ত্রণ',
    searchPlaceholder: 'জব আইডি, দল, এসকেইউ, ক্লায়েন্ট বা চালান খুঁজুন...',
    soundOn: 'সাউন্ড এফেক্ট চালু',
    soundOff: 'সাউন্ড মিউট করা',
    scanQrBtn: 'কিউআর স্ক্যান করুন',
    chatBtn: 'অভ্যন্তরীণ চ্যাট',
    newOrderBtn: 'নতুন জব কার্ড',
    roleSwitcher: 'ভূমিকা পরিবর্তন',
    activeRole: 'বর্তমান ভূমিকা',
    locationAll: 'সকল কারখানা ও দপ্তর',
    locationHq: 'বনানী হেড অফিস (সেলস/ডিজাইন)',
    locationPrint: 'টঙ্গী প্রিন্ট মিল (সাবলিমেশন)',
    locationSewing: 'মিরপুর সুইং কারখানা',

    // Left Sidebar Navigation
    navDashboardTasks: 'ড্যাশবোর্ড ও দায়িত্বসমূহ',
    navOrders: 'জব কার্ড ও পাইপলাইন',
    navHeadOffice: 'হেড অফিস সেলস ও সিআরএম',
    navPrintFloor: 'টঙ্গী প্রিন্ট কারখানা',
    navSewingFloor: 'মিরপুর সুইং লাইন',
    navShortages: 'জরুরি রি-প্রিন্ট টিকিট',
    nav3dStudio: '৩ডি জার্সি স্টুডিও',
    navMockupStudio: 'এআই মকআপ জেনারেটর',
    navAccounting: 'অ্যাকাউন্টিং ও লেজার',
    navInventory: 'কাপড় ও কাঁচামাল স্টক',
    navHrPayroll: 'এইচআর, হাজিরা ও বেতন',
    navManagersPortal: 'ম্যানেজার অনুমোদন ডেস্ক',
    navEmployeePortal: 'ব্যক্তিগত ওয়ার্কস্টেশন',

    // Categories in Sidebar
    catCore: 'ফ্যাক্টরি পাইপলাইন',
    catDesign: 'ডিজাইন ও মকআপ',
    catFinance: 'অর্থ ও ইনভেন্টরি',
    catWorkforce: 'কর্মী ও পোর্টাল',

    // Common Actions
    advanceStage: 'পরবর্তী ধাপে পাঠান',
    completed: 'সম্পন্ন',
    inProgress: 'চলমান',
    pending: 'অপেক্ষমাণ',
    raiseShortage: 'রি-প্রিন্ট রিকুয়েস্ট করুন',
    printQrTag: 'কিউআর ট্যাগ প্রিন্ট',
    viewDetails: 'বিস্তারিত দেখুন',
    exportPdf: 'পিডিএফ ডাউনলোড',
    saveChanges: 'সংরক্ষণ করুন',
    cancel: 'বাতিল',
    confirm: 'নিশ্চিত করুন',
    urgent: 'জরুরি',

    // Attendance Manager Entry
    attendanceTitle: 'বিভাগীয় হাজিরা টার্মিনাল',
    attendanceSubtitle: 'বিভাগীয় ম্যানেজার: কর্মীদের দৈনিক হাজিরা, ওভারটাইম এবং শিফট এন্ট্রি করুন',
    selectDept: 'বিভাগ / কারখানা নির্বাচন করুন',
    markAllPresent: 'এক ক্লিকে সবাইকে উপস্থিত করুন',
    present: 'উপস্থিত',
    late: 'বিলম্বিত',
    absent: 'অনুপস্থিত',
    overtime: 'ওভারটাইম',
    shift: 'শিফট',
    checkIn: 'ইন টাইম',
    checkOut: 'আউট টাইম',
    status: 'অবস্থা',
    actions: 'অ্যাকশন',
    todaySummary: 'আজকের ডিউটি রোস্টার',

    // Dashboard & Tasks Specific
    welcomeBack: 'এন্টারপ্রাইজ অপারেশন কমান্ড',
    taskQueueTitle: 'আমার বিভাগের দায়িত্ব তালিকা',
    taskQueueSubtitle: 'আপনার বিভাগ বা পদের জন্য তাৎক্ষণিক করণীয় কাজের তালিকা',
    noPendingTasks: 'আপনার বিভাগে এই মুহূর্তে কোনো কাজ আটকে নেই! সকল কাজ সম্পন্ন।',
    quickAdvance: 'সহজ আপডেট',
    activeOrdersCount: 'চলমান অর্ডারসমূহ',
    urgentShortagesCount: 'জরুরি রি-প্রিন্ট',
    factoryFloorThroughput: 'কারখানা উৎপাদন হার',
    totalRevenue: 'পাইপলাইনের মোট মূল্য',
    pendingPayments: 'অপেক্ষমাণ পেমেন্ট',
    todayClockIns: 'উপস্থিত কারখানার কর্মী',

    // Shortage
    shortageAlertBanner: 'জরুরি রি-প্রিন্ট টিকিট পেন্ডিং রয়েছে (তাৎক্ষণিক মনোযোগ প্রয়োজন)',
    reprintPieces: 'নষ্ট / প্রতিস্থাপন টুকরা',
  },
};

export const STAGE_DETAILS: Record<string, { en: StageTranslation; bn: StageTranslation }> = {
  payment_pending: {
    en: {
      title: 'Payment Pending',
      desc: 'Order created by Marketing; waiting for 50% advance deposit',
      actionPrompt: 'Verify 50% advance payment from customer',
      nextStepName: 'Payment Verified',
    },
    bn: {
      title: 'পেমেন্ট অপেক্ষমাণ',
      desc: 'মার্কেটিং অর্ডার তৈরি করেছে; ৫০% অগ্রিম জমার অপেক্ষা',
      actionPrompt: 'ক্লায়েন্টের ৫০% অগ্রিম পেমেন্ট ভেরিফাই করুন',
      nextStepName: 'পেমেন্ট অনুমোদিত',
    },
  },
  payment_verified: {
    en: {
      title: 'Payment Verified',
      desc: 'Accounts approved advance; queued for Design Team 1 mockup',
      actionPrompt: 'Assign to Design Team 1 for concept artwork',
      nextStepName: 'Mockup In Progress',
    },
    bn: {
      title: 'পেমেন্ট অনুমোদিত',
      desc: 'হিসাব বিভাগ অগ্রিম গ্রহণ করেছে; ডিজাইন টিম ১ এর মকআপের জন্য প্রস্তুত',
      actionPrompt: 'ডিজাইন টিম ১ কে মকআপ তৈরির নির্দেশ দিন',
      nextStepName: 'মকআপ তৈরি চলছে',
    },
  },
  mockup_in_progress: {
    en: {
      title: 'Mockup In Progress',
      desc: 'Design Team 1 creating 2D/3D jersey graphics & client mockup',
      actionPrompt: 'Submit mockup for client approval',
      nextStepName: 'Mockup Approved',
    },
    bn: {
      title: 'মকআপ তৈরি চলছে',
      desc: 'ডিজাইন টিম ১ জার্সির টুডি/থ্রিডি ডিজাইন ও ক্লায়েন্ট মকআপ প্রস্তুত করছে',
      actionPrompt: 'ক্লায়েন্টের অনুমোদনের জন্য মকআপ পেশ করুন',
      nextStepName: 'মকআপ অনুমোদিত',
    },
  },
  mockup_approved: {
    en: {
      title: 'Mockup Approved',
      desc: 'Client approved visual art; queued for Design Team 2 grading',
      actionPrompt: 'Generate pattern files, nested layout & spec sheets',
      nextStepName: 'Pattern Spec Ready',
    },
    bn: {
      title: 'মকআপ অনুমোদিত',
      desc: 'ক্লায়েন্ট ডিজাইন পছন্দ করেছে; ডিজাইন টিম ২ এর সাইজ গ্রেডিং অপেক্ষা',
      actionPrompt: 'সাইজ গ্রেডিং ও প্রিন্ট-রেডি ফাইল তৈরি সম্পন্ন করুন',
      nextStepName: 'প্রিন্ট-রেডি ফাইল প্রস্তুত',
    },
  },
  pattern_spec_ready: {
    en: {
      title: 'Pattern & Print Ready',
      desc: 'Print-ready files and Drive link uploaded; sent to Tongi Factory',
      actionPrompt: 'Queue sublimation printer & load paper roll',
      nextStepName: 'Paper Printed',
    },
    bn: {
      title: 'প্রিন্ট-রেডি ফাইল প্রস্তুত',
      desc: 'ড্রাইভ লিঙ্ক ও স্পেক শিট আপলোড হয়েছে; টঙ্গী প্রিন্ট কারখানায় প্রেরণ',
      actionPrompt: 'সাবলিমেশন পেপার প্রিন্ট সম্পন্ন করুন',
      nextStepName: 'পেপার প্রিন্ট সম্পন্ন',
    },
  },
  paper_printed: {
    en: {
      title: 'Paper Sublimation Printed',
      desc: 'Design printed on sublimation transfer paper at Tongi factory',
      actionPrompt: 'Heat press transfer onto poly-spandex fabric rolls',
      nextStepName: 'Heat Press Done',
    },
    bn: {
      title: 'পেপার প্রিন্ট সম্পন্ন',
      desc: 'টঙ্গী কারখানায় সাবলিমেশন পেপারে ডিজাইন প্রিন্ট সম্পন্ন হয়েছে',
      actionPrompt: 'রোটারি ক্যালেন্ডার মেশিনে হিট প্রেস সম্পন্ন করুন',
      nextStepName: 'হিট প্রেস সম্পন্ন',
    },
  },
  heat_press_done: {
    en: {
      title: 'Heat Press Done',
      desc: 'Colors transferred into fabric fibers; ready for dispatch to sewing',
      actionPrompt: 'Pack printed fabric bundles & dispatch to Mirpur Sewing',
      nextStepName: 'Dispatched to Sewing',
    },
    bn: {
      title: 'হিট প্রেস সম্পন্ন',
      desc: 'ফ্যাব্রিকের আঁশে রং স্থায়ীভাবে বসেছে; মিরপুর কারখানায় পাঠানোর জন্য প্রস্তুত',
      actionPrompt: 'ফ্যাব্রিক রোল প্যাক করে মিরপুর কারখানায় চালান পাঠান',
      nextStepName: 'মিরপুরে পাঠানো হয়েছে',
    },
  },
  fabric_dispatched: {
    en: {
      title: 'Dispatched to Sewing',
      desc: 'In transit from Tongi Factory to Mirpur Sewing Factory',
      actionPrompt: 'Acknowledge receiving bundle with Challan QR check',
      nextStepName: 'Fabric Received',
    },
    bn: {
      title: 'মিরপুরে পাঠানো হয়েছে',
      desc: 'টঙ্গী প্রিন্ট মিল থেকে মিরপুর কারখানার পথে ট্রাকে আছে',
      actionPrompt: 'মিরপুর কারখানায় কিউআর স্ক্যান করে রিসিভ করুন',
      nextStepName: 'ফ্যাব্রিক রিসিভ করা হয়েছে',
    },
  },
  fabric_received: {
    en: {
      title: 'Fabric Received at Mirpur',
      desc: 'Floor manager verified bundle quantity; loaded onto cutting tables',
      actionPrompt: 'Begin precision laser/hand cutting & sewing line feed',
      nextStepName: 'Cutting & Sewing',
    },
    bn: {
      title: 'ফ্যাব্রিক রিসিভ করা হয়েছে',
      desc: 'মিরপুর ফ্লোর ম্যানেজার বান্ডেল গুনে বুঝে পেয়েছেন; কাটিং টেবিলে তোলা হয়েছে',
      actionPrompt: 'কাটিং ও সুইং লাইনে সেলাই শুরু করুন',
      nextStepName: 'কাটিং ও সেলাই চলমান',
    },
  },
  cutting_sewing: {
    en: {
      title: 'Cutting & Sewing Active',
      desc: 'Operators assembling front, back, collar, and side mesh panels',
      actionPrompt: 'Final stitching complete; move to QA inspection & poly bagging',
      nextStepName: 'Quality Check & Packing',
    },
    bn: {
      title: 'কাটিং ও সেলাই চলমান',
      desc: 'সুইং অপারেটররা কলার, হাতা, বডি ও সাইড প্যানেল সেলাই করছেন',
      actionPrompt: 'সেলাই শেষ করে কিউসি ও পলি প্যাকিংয়ে পাঠান',
      nextStepName: 'কোয়ালিটি চেক ও প্যাকিং',
    },
  },
  quality_finishing: {
    en: {
      title: 'Quality Check & Packing',
      desc: 'Measurement audit, thread trim, individual poly bagging complete',
      actionPrompt: 'Dispatch finished cartons with courier tracking number',
      nextStepName: 'Shipped',
    },
    bn: {
      title: 'কোয়ালিটি চেক ও প্যাকিং',
      desc: 'মেজারমেন্ট অডিট, সুতা কাটা এবং স্বতন্ত্র পলি প্যাকিং সম্পন্ন',
      actionPrompt: 'কুরিয়ারে বুকিং দিয়ে ট্র্যাকিং নম্বর এন্ট্রি করুন',
      nextStepName: 'কুরিয়ারে পাঠানো হয়েছে',
    },
  },
  quality_packing: {
    en: {
      title: 'Quality Check & Packing',
      desc: 'Measurement audit, thread trim, individual poly bagging complete',
      actionPrompt: 'Dispatch finished cartons with courier tracking number',
      nextStepName: 'Shipped',
    },
    bn: {
      title: 'কোয়ালিটি চেক ও প্যাকিং',
      desc: 'মেজারমেন্ট অডিট, সুতা কাটা এবং স্বতন্ত্র পলি প্যাকিং সম্পন্ন',
      actionPrompt: 'কুরিয়ারে বুকিং দিয়ে ট্র্যাকিং নম্বর এন্ট্রি করুন',
      nextStepName: 'কুরিয়ারে পাঠানো হয়েছে',
    },
  },
  shipped: {
    en: {
      title: 'Shipped to Customer',
      desc: 'Consignment handed over to courier (Steadfast/Sundarban/RedX)',
      actionPrompt: 'Verify customer delivery receipt & full payment clearance',
      nextStepName: 'Delivered',
    },
    bn: {
      title: 'কুরিয়ারে পাঠানো হয়েছে',
      desc: 'পার্সেল কুরিয়ারকে (রেডএক্স/সুন্দরবন/স্টেডফাস্ট) হস্তান্তর করা হয়েছে',
      actionPrompt: 'গ্রাহক পণ্য পেয়েছেন কিনা নিশ্চিত করে ডেলিভার্ড করুন',
      nextStepName: 'সফলভাবে ডেলিভার্ড',
    },
  },
  delivered: {
    en: {
      title: 'Delivered & Closed',
      desc: 'Customer received goods, final settlement complete in Ledger',
      actionPrompt: 'Order lifecycle successfully completed',
      nextStepName: 'Completed',
    },
    bn: {
      title: 'সফলভাবে ডেলিভার্ড',
      desc: 'গ্রাহক পণ্য বুঝে পেয়েছেন এবং চূড়ান্ত পেমেন্ট সম্পন্ন হয়েছে',
      actionPrompt: 'অর্ডারের সকল কাজ সফলভাবে সম্পন্ন',
      nextStepName: 'সম্পন্ন',
    },
  },
};

export const ROLE_TRANSLATIONS: Record<string, { en: string; bn: string }> = {
  owner: { en: 'Super Admin / Managing Director', bn: 'ম্যানেজিং ডিরেক্টর / মালিক' },
  marketing: { en: 'Head Office Sales & CRM', bn: 'সেলস ও কাস্টমার সার্ভিস' },
  design_mockup: { en: 'Design Team 1 (2D/3D Mockup)', bn: 'ডিজাইন টিম ১ (মকআপ ও কনসেপ্ট)' },
  design_pattern: { en: 'Design Team 2 (Print & Grading)', bn: 'ডিজাইন টিম ২ (প্রিন্ট ফাইল ও সাইজ)' },
  print_factory: { en: 'Tongi Print Factory Manager', bn: 'টঙ্গী প্রিন্ট ফ্যাক্টরি ম্যানেজার' },
  sewing_factory: { en: 'Mirpur Sewing Factory Manager', bn: 'মিরপুর সুইং ফ্যাক্টরি ম্যানেজার' },
  accountant: { en: 'Chief Financial Officer', bn: 'প্রধান হিসাবরক্ষক' },
  hr_manager: { en: 'HR & Factory Operations Head', bn: 'এইচআর ও প্রশাসন কর্মকর্তা' },
  floor_worker: { en: 'Production Floor Technician', bn: 'প্রোডাকশন ফ্লোর কর্মী' },
};

export function getTranslation(key: keyof typeof TRANSLATIONS.en, lang: Language): string {
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;
}

export function getStageTranslation(stage: string, lang: Language): StageTranslation {
  const fallback: StageTranslation = {
    title: stage.replace(/_/g, ' '),
    desc: 'Stage workflow',
    actionPrompt: 'Advance to next stage',
    nextStepName: 'Next Stage',
  };
  return STAGE_DETAILS[stage]?.[lang] || fallback;
}

export function getRoleName(role: string, lang: Language): string {
  return ROLE_TRANSLATIONS[role]?.[lang] || role.replace(/_/g, ' ');
}
