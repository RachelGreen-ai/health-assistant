export type Language = 'en' | 'zh-CN';

export const strings: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    home: 'Home',
    chat: 'Chat',
    records: 'Records',
    appointments: 'Appts',
    prep: 'Prep',
    // Greeting
    greetingMorning: 'Good morning',
    greetingAfternoon: 'Good afternoon',
    greetingEvening: 'Good evening',
    // Home CTA
    ctaTitle: 'Ask HealthCompanion',
    askPrompt: 'How are you feeling? I can check your records, explain your labs, or help you prepare for your next visit.',
    voiceBtn: 'Voice',
    typeBtn: 'Type',
    // Home alerts
    actionNeeded: 'Action needed',
    watchClosely: 'Watch closely',
    prepChecklistReady: 'Prep checklist ready',
    // Chat
    chatPlaceholder: 'Ask about your health…',
    send: 'Send',
    listening: 'Listening…',
    transcribing: 'Transcribing…',
    // Records
    labResults: 'Lab Results',
    medications: 'Medications',
    watchList: 'Watch List',
    monitored: 'monitored',
    watchListHint: 'Tap results below to add them to your Watch List',
    watchToggleHint: 'Tap to watch/unwatch',
    askAI: 'Ask AI',
    selectBtn: 'Select',
    doneBtn: 'Done',
    // Appointments
    appointmentsTitle: 'Appointments',
    upcomingTitle: 'Upcoming',
    pastVisitsTitle: 'Past Visits',
    statusSoon: 'Soon',
    statusUpcoming: 'Upcoming',
    prepBtn: 'Prep',
    prepWithAI: 'Prep with AI',
    rescheduleBtn: 'Reschedule',
    visitSummary: 'Visit Summary',
    reviewWithAI: 'Review with AI',
    reviewWithAISub: 'Get a plain-language summary of this visit',
    // Prep
    prepTitle: 'Appointment Prep',
    prepSubtitle: 'Dr. Patel · BMT Clinic · Mar 30, 2026',
    aiChecklist: 'AI-Generated Checklist',
    itemsToDiscuss: 'items to discuss',
    draftBtn: 'Draft',
    askAIMore: 'Ask AI for more suggestions',
    // Auth
    noRecords: 'No records available. Authorize Epic to load your health data.',
    authorize: 'Connect Health Records',
  },
  'zh-CN': {
    // Navigation
    home: '主页',
    chat: '对话',
    records: '记录',
    appointments: '预约',
    prep: '准备',
    // Greeting
    greetingMorning: '早上好',
    greetingAfternoon: '下午好',
    greetingEvening: '晚上好',
    // Home CTA
    ctaTitle: '向健康助手提问',
    askPrompt: '您今天感觉如何？我可以查看您的病历、解释您的化验结果，或帮您准备下次就诊。',
    voiceBtn: '语音',
    typeBtn: '输入',
    // Home alerts
    actionNeeded: '需要处理',
    watchClosely: '密切关注',
    prepChecklistReady: '备诊清单已就绪',
    // Chat
    chatPlaceholder: '询问您的健康问题…',
    send: '发送',
    listening: '聆听中…',
    transcribing: '转录中…',
    // Records
    labResults: '化验结果',
    medications: '药物',
    watchList: '监测列表',
    monitored: '项监测中',
    watchListHint: '点击以下结果添加到监测列表',
    watchToggleHint: '点击监测/取消监测',
    askAI: '询问AI',
    selectBtn: '选择',
    doneBtn: '完成',
    // Appointments
    appointmentsTitle: '就诊记录',
    upcomingTitle: '即将到来',
    pastVisitsTitle: '过往就诊',
    statusSoon: '即将',
    statusUpcoming: '未来',
    prepBtn: '备诊',
    prepWithAI: 'AI备诊',
    rescheduleBtn: '重新预约',
    visitSummary: '就诊摘要',
    reviewWithAI: 'AI解读',
    reviewWithAISub: '获取本次就诊的通俗摘要',
    // Prep
    prepTitle: '就诊准备',
    prepSubtitle: '帕特尔医生 · 骨髓移植门诊 · 2026年3月30日',
    aiChecklist: 'AI生成清单',
    itemsToDiscuss: '项待讨论',
    draftBtn: '草拟',
    askAIMore: '让AI提供更多建议',
    // Auth
    noRecords: '暂无记录。请授权 Epic 加载您的健康数据。',
    authorize: '连接健康记录',
  },
};
