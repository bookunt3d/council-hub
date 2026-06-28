import type { Sage, PanelKey } from './types'

export const ALL_SAGES: Sage[] = [
  {
    id: 'farabi',
    name: 'فارابی',
    emoji: '🔵',
    role: 'chair',
    desc: 'ابونصر فارابی. منطق‌گرا، سیستماتیک: علل اربعه، مدینه فاضله.',
    lens: 'منطق ارسطویی، نظام‌مندی، غایت‌شناسی',
    work: 'آراء اهل المدینه الفاضله',
    quote: '«السعاده هی الکمال الذی یتشوق الیه کل انسان»',
  },
  {
    id: 'razi',
    name: 'رازی',
    emoji: '⚕️',
    role: 'member',
    desc: 'ابوبکر محمد زکریای رازی. تجربه‌گرا، شک‌آور، پزشک.',
    lens: 'تجربه، مشاهده، نقد سنت',
    work: 'الحاوی فی الطب',
    quote: '«حق آن است که هر چه را که به حس و تجربه درنیاید، نباید پذیرفت»',
  },
  {
    id: 'ebnesina',
    name: 'ابن‌سینا',
    emoji: '📚',
    role: 'member',
    desc: 'ابوعلی سینا. فلسفه، طب، منطق جامع.',
    lens: 'برهان سینوی، وجودشناسی، منطق',
    work: 'الشفاء، قانون',
    quote: '«العلم صوره الشیء فی العقل»',
  },
  {
    id: 'sadi',
    name: 'سعدی',
    emoji: '🌹',
    role: 'member',
    desc: 'مصلح‌الدین سعدی شیرازی. اخلاق، سیاست عملی، ادب.',
    lens: 'اخلاق عملی، پندآموزی، عدالت',
    work: 'گلستان، بوستان',
    quote: '«بنی‌آدم اعضای یکدیگرند»',
  },
  {
    id: 'khayyam',
    name: 'خیام',
    emoji: '🔭',
    role: 'member',
    desc: 'عمر خیام نیشابوری. ریاضی، نجوم، شک فلسفی.',
    lens: 'شک‌گرایی، ناپایداری جهان، طنز تلخ',
    work: 'رباعیات، جبر و مقابله',
    quote: '«این قافله عمر عجب می‌گذرد»',
  },
  {
    id: 'mollasadra',
    name: 'ملاصدرا',
    emoji: '✨',
    role: 'member',
    desc: 'صدرالمتألهین شیرازی. وجودگرا، حرکت جوهری.',
    lens: 'اصالت وجود، حرکت جوهری، عرفان نظری',
    work: 'اسفار اربعه',
    quote: '«الوجود اصیل و الماهیه اعتباری»',
  },
  {
    id: 'amirkabir',
    name: 'امیرکبیر',
    emoji: '⚡',
    role: 'member',
    desc: 'میرزا تقی‌خان فراهانی. عمل، نوسازی، اصلاحات.',
    lens: 'عملگرایی، توسعه، عقلانیت ابزاری',
    work: 'دارالفنون',
    quote: '«دولت از علم است و جهل، ویرانی»',
  },
  {
    id: 'khajehnezam',
    name: 'خواجه‌نظام',
    emoji: '🏛️',
    role: 'member',
    desc: 'خواجه نظام‌الملک طوسی. سیاست، امنیت، مصلحت.',
    lens: 'قدرت، منافع ملی، مصلحت‌اندیشی',
    work: 'سیاست‌نامه',
    quote: '«پادشاه باید که دانا و دادگر باشد»',
  },
  {
    id: 'biruni',
    name: 'بیرونی',
    emoji: '🟢',
    role: 'secretary',
    desc: 'ابوریحان بیرونی. دانشمند، دقیق، بی‌طرف.',
    lens: 'دقت علمی، اندازه‌گیری، بی‌طرفی',
    work: 'آثار الباقیه، تحقیق ماللهند',
    quote: '«آنچه درست است، خواه ناخوش باشد، باید گفت»',
  },
  {
    id: 'molana',
    name: 'مولانا',
    emoji: '🟠',
    role: 'member',
    desc: 'جلال‌الدین محمد بلخی. عارف، شهودی، کل‌نگر.',
    lens: 'عشق، شهود، وحدت وجود',
    work: 'مثنوی معنوی',
    quote: '«از هر چه بگویی عشق، جز عشق فسون است»',
  },
]

export const SAGE_MAP = new Map(ALL_SAGES.map(s => [s.id, s]))

export const PANELS: Record<PanelKey, string[]> = {
  quick: ['farabi', 'razi'],               // 2 sages
  full: ['farabi', 'razi', 'ebnesina', 'sadi', 'molana'], // 5 sages
  all: ALL_SAGES.map(s => s.id),          // 10 sages
}

export function getPanel(key: PanelKey): Sage[] {
  return PANELS[key].map(id => SAGE_MAP.get(id)!).filter(Boolean)
}

const PANEL_NAMES: Record<number, string> = { 2: 'چکیده', 5: 'جامع', 10: 'کامل' }
export function getPanelName(count: number): string { return PANEL_NAMES[count] ?? `شورا` }
