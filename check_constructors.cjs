const tags = `ActionButton ActivityItem AlertCircle AlertItem ArrowDownRight ArrowLeft ArrowRight ArrowUpRight BarChart2 Bell Box Building2 Calendar CalendarIcon Camera Check CheckCircle CheckCircle2 ChecklistItem ChevronDown ChevronLeft ChevronRight ClipboardCheck ClipboardList Clock Cloud ConfigToggle CreditCard DashboardPreview DataRow DetailItem DiscountTier DollarSign DossierItem ExternalLink ExtractedField ExtractionCard Eye EyeOff FeatureCard FileCheck FileDown FileItem FileSearch FileSignature FileText Filter FilterItem FinancialCard FinancialRow FinancialSummaryCard Folder Globe GoogleIcon Hammer HardHat History Info KitItem LayoutDashboard LayoutGrid LifeBuoy Link LinkIcon List Lock LogoIcon Mail MailIcon MapPin MessageSquare MoreHorizontal Package Paperclip Percent Phone PhotoCard PieChart Plus PortalFile Presentation PreviewCard ProjectRow Save Search Send Settings Share2 Shield ShieldCheck ShoppingCart Smartphone Sparkles StatCard StatusBadge SummaryCard SummaryMiniCard TabButton Tag TeamMember TemplateItem TimelineStep ToggleItem Trash2 TrendingUp Triangle Trophy Upload UserCheck UserCircle UserIcon UserRow Users Wallet Wrench Zap`.split(' ');

for (const tag of tags) {
  try {
    if (typeof globalThis[tag] === 'function' && globalThis[tag].prototype) {
      console.log(`Tag ${tag} is a global constructor`);
    }
  } catch (e) {}
}
