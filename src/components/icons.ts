/**
 * Fireware CRM — Centralized Icon Mapping
 * 
 * This file re-exports Phosphor Icons using the same component names
 * that were previously used from lucide-react. This enables a seamless
 * migration across the entire codebase by only changing the import path.
 * 
 * Usage:
 *   import { Plus, Search, Filter } from '@/components/icons';
 * 
 * All icons use Phosphor's "regular" weight by default.
 * Components can override with weight="duotone" | "bold" | "fill" etc.
 */

// ─── Direct name matches (same name in both libraries) ─────────────
export {
  ArrowDown,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Bell,
  Brain,
  Bug,
  Building,
  Check,
  CheckCircle,
  CheckSquare,
  Clock,
  Code,
  Cpu,
  Database,
  Eye,
  FileText,
  Fingerprint,
  FolderOpen,
  Gauge,
  GitBranch,
  Handshake,
  HardDrive,
  Heart,
  Info,
  Link,
  Lock,
  Megaphone,
  Minus,
  Monitor,
  Moon,
  Package,
  Paperclip,
  Pause,
  Percent,
  Phone,
  Play,
  Plus,
  ShoppingCart,
  Star,
  Sun,
  Tag,
  ThumbsDown,
  ThumbsUp,
  Ticket,
  Timer,
  User,
  UserCircle,
  UserPlus,
  Wrench,
  X,
  XCircle,
  MapPin,
} from '@phosphor-icons/react';

// ─── Aliased exports (different name in Phosphor) ──────────────────

// A
export { Pulse as Activity } from '@phosphor-icons/react';
export { WarningCircle as AlertCircle } from '@phosphor-icons/react';
export { Warning as AlertTriangle } from '@phosphor-icons/react';
export { Archive } from '@phosphor-icons/react';
export { ArrowsDownUp as ArrowUpDown } from '@phosphor-icons/react';
export { Trophy as Award } from '@phosphor-icons/react';

// B
export { Prohibit as Ban } from '@phosphor-icons/react';
export { ChartBar as BarChart3 } from '@phosphor-icons/react';
export { BookOpenText as BookOpen } from '@phosphor-icons/react';
export { Robot as Bot } from '@phosphor-icons/react';
export { Buildings as Building2 } from '@phosphor-icons/react';

// C
export { CalendarBlank as Calendar } from '@phosphor-icons/react';
export { CalendarBlank as CalendarIcon } from '@phosphor-icons/react';
export { Checks as CheckCheck } from '@phosphor-icons/react';
export { CaretDown as ChevronDown } from '@phosphor-icons/react';
export { CaretLeft as ChevronLeft } from '@phosphor-icons/react';
export { CaretRight as ChevronRight } from '@phosphor-icons/react';
export { CaretUp as ChevronUp } from '@phosphor-icons/react';
export { ClipboardText as ClipboardList } from '@phosphor-icons/react';
export { CopySimple as Copy } from '@phosphor-icons/react';

// D
export { CurrencyDollar as DollarSign } from '@phosphor-icons/react';
export { DownloadSimple as Download } from '@phosphor-icons/react';

// E
export { PencilSimple as Edit } from '@phosphor-icons/react';
export { ArrowSquareOut as ExternalLink } from '@phosphor-icons/react';
export { EyeSlash as EyeOff } from '@phosphor-icons/react';

// F
export { ChartLine as FileBarChart } from '@phosphor-icons/react';
export { PenNib as FileSignature } from '@phosphor-icons/react';
export { Funnel as Filter } from '@phosphor-icons/react';
export { Fire as Flame } from '@phosphor-icons/react';

// G
export { GlobeSimple as Globe } from '@phosphor-icons/react';
export { DotsSixVertical as GripVertical } from '@phosphor-icons/react';

// H
export { Headset as Headphones } from '@phosphor-icons/react';
export { ClockCounterClockwise as History } from '@phosphor-icons/react';
export { House as Home } from '@phosphor-icons/react';

// I
export { Tray as Inbox } from '@phosphor-icons/react';

// L
export { SquaresFour as LayoutDashboard } from '@phosphor-icons/react';
export { SquaresFour as LayoutGrid } from '@phosphor-icons/react';
export { ListDashes as LayoutList } from '@phosphor-icons/react';
export { Stack as Layers } from '@phosphor-icons/react';
export { LinkedinLogo as Linkedin } from '@phosphor-icons/react';
export { ListBullets as List } from '@phosphor-icons/react';
export { SpinnerGap as Loader2 } from '@phosphor-icons/react';
export { SignOut as LogOut } from '@phosphor-icons/react';

// M
export { Envelope as Mail } from '@phosphor-icons/react';
export { MapTrifold as Map } from '@phosphor-icons/react';
export { List as Menu } from '@phosphor-icons/react';
export { GitMerge as Merge } from '@phosphor-icons/react';
export { ChatCircle as MessageCircle } from '@phosphor-icons/react';
export { ChatDots as MessageSquare } from '@phosphor-icons/react';
export { DotsThree as MoreHorizontal } from '@phosphor-icons/react';

// P
export { PencilSimple as Pencil } from '@phosphor-icons/react';
export { ChartPie as PieChart } from '@phosphor-icons/react';

// R
export { Broadcast as Radio } from '@phosphor-icons/react';
export { ArrowCounterClockwise as RefreshCcw } from '@phosphor-icons/react';
export { ArrowClockwise as RefreshCw } from '@phosphor-icons/react';
export { ArrowCounterClockwise as RotateCcw } from '@phosphor-icons/react';
export { Path as Route } from '@phosphor-icons/react';

// S
export { FloppyDisk as Save } from '@phosphor-icons/react';
export { MagnifyingGlass as Search } from '@phosphor-icons/react';
export { PaperPlaneTilt as Send } from '@phosphor-icons/react';
export { HardDrives as Server } from '@phosphor-icons/react';
export { GearSix as Settings } from '@phosphor-icons/react';
export { ShieldCheck as Shield } from '@phosphor-icons/react';
export { ShieldWarning as ShieldAlert } from '@phosphor-icons/react';
export { ShieldSlash as ShieldX } from '@phosphor-icons/react';
export { SlidersHorizontal } from '@phosphor-icons/react';
export { DeviceMobile as Smartphone } from '@phosphor-icons/react';
export { Sparkle as Sparkles } from '@phosphor-icons/react';
export { Notepad as StickyNote } from '@phosphor-icons/react';

// T
export { Crosshair as Target } from '@phosphor-icons/react';
export { Trash as Trash2 } from '@phosphor-icons/react';
export { TrendDown as TrendingDown } from '@phosphor-icons/react';
export { TrendUp as TrendingUp } from '@phosphor-icons/react';

// U
export { UploadSimple as Upload } from '@phosphor-icons/react';
export { UsersThree as Users } from '@phosphor-icons/react';

// W
export { FlowArrow as Workflow } from '@phosphor-icons/react';

// Z
export { Lightning as Zap } from '@phosphor-icons/react';

// ─── Additional icons needed by Commerce, Service, Marketing, Admin ─
export { Truck } from '@phosphor-icons/react';
export { CreditCard } from '@phosphor-icons/react';
export { Gift } from '@phosphor-icons/react';
export { Calculator } from '@phosphor-icons/react';
export { Printer } from '@phosphor-icons/react';
export { PhoneSlash as PhoneOff } from '@phosphor-icons/react';
export { EnvelopeSimple as MailX } from '@phosphor-icons/react';
export { Briefcase } from '@phosphor-icons/react';
export { FileDashed as FileCheck } from '@phosphor-icons/react';
export { Question as HelpCircle } from '@phosphor-icons/react';
export { CheckCircle as CheckCircle2 } from '@phosphor-icons/react';
export { NumberCircleOne as Hash } from '@phosphor-icons/react';
export { Palette } from '@phosphor-icons/react';
export { TextT as Type } from '@phosphor-icons/react';
export { ToggleLeft } from '@phosphor-icons/react';
export { ListNumbers } from '@phosphor-icons/react';
export { CalendarCheck } from '@phosphor-icons/react';
export { TextAlignLeft as AlignLeft } from '@phosphor-icons/react';
export { LinkSimple } from '@phosphor-icons/react';
export { ListBullets } from '@phosphor-icons/react';
export { Image } from '@phosphor-icons/react';
export { Rows } from '@phosphor-icons/react';
export { Columns } from '@phosphor-icons/react';
export { Cursor as MousePointer } from '@phosphor-icons/react';
export { ArrowsOut as Maximize2 } from '@phosphor-icons/react';
export { ArrowsIn as Minimize2 } from '@phosphor-icons/react';
export { Copy as ClipboardCopy } from '@phosphor-icons/react';
export { WarningOctagon as AlertOctagon } from '@phosphor-icons/react';
export { Scroll } from '@phosphor-icons/react';
export { Sliders } from '@phosphor-icons/react';
export { ShareNetwork as Share2 } from '@phosphor-icons/react';
export { Bookmark } from '@phosphor-icons/react';
export { PushPin as Pin } from '@phosphor-icons/react';
export { Power } from '@phosphor-icons/react';
export { Plugs as PlugZap } from '@phosphor-icons/react';
export { Gear as Cog } from '@phosphor-icons/react';
export { CircleDashed as Circle } from '@phosphor-icons/react';
export { SquaresFour as Grid } from '@phosphor-icons/react';
export { MagicWand as Wand2 } from '@phosphor-icons/react';
export { Funnel as FunnelSimple } from '@phosphor-icons/react';
export { ChartLineUp as LineChart } from '@phosphor-icons/react';
export { TreeStructure } from '@phosphor-icons/react';
export { UsersThree as UserGroup } from '@phosphor-icons/react';
export { CaretDoubleRight as ChevronsRight } from '@phosphor-icons/react';
export { CaretDoubleLeft as ChevronsLeft } from '@phosphor-icons/react';
export { Chats as MessagesSquare } from '@phosphor-icons/react';
export { WhatsappLogo } from '@phosphor-icons/react';
export { At } from '@phosphor-icons/react';
export { SmileySticker as Smile } from '@phosphor-icons/react';
export { DotsThreeVertical as MoreVertical } from '@phosphor-icons/react';
export { ArrowBendUpLeft as Reply } from '@phosphor-icons/react';
export { ArrowBendDoubleUpLeft as ReplyAll } from '@phosphor-icons/react';
export { ArrowBendUpRight as Forward } from '@phosphor-icons/react';
export { FlagBanner as Flag } from '@phosphor-icons/react';
export { Siren } from '@phosphor-icons/react';
export { Headset } from '@phosphor-icons/react';
export { PhoneCall } from '@phosphor-icons/react';
export { Voicemail } from '@phosphor-icons/react';
export { VideoCamera as Video } from '@phosphor-icons/react';
export { MonitorPlay as ScreenShare } from '@phosphor-icons/react';
export { MicrophoneSlash as MicOff } from '@phosphor-icons/react';
export { Microphone as Mic } from '@phosphor-icons/react';
export { SpeakerHigh as Volume2 } from '@phosphor-icons/react';
export { SpeakerSlash as VolumeX } from '@phosphor-icons/react';
export { Record } from '@phosphor-icons/react';
export { SkipForward } from '@phosphor-icons/react';
export { Stop } from '@phosphor-icons/react';
export { Shuffle } from '@phosphor-icons/react';
export { Queue } from '@phosphor-icons/react';
export { ChatText } from '@phosphor-icons/react';
export { Envelope } from '@phosphor-icons/react';
export { InstagramLogo } from '@phosphor-icons/react';
export { FacebookLogo } from '@phosphor-icons/react';
export { TwitterLogo } from '@phosphor-icons/react';
export { TelegramLogo } from '@phosphor-icons/react';
export { PhoneIncoming } from '@phosphor-icons/react';
export { PhoneOutgoing } from '@phosphor-icons/react';
export { PhoneX as PhoneMissed } from '@phosphor-icons/react';
export { ClipboardText as ClipboardCheck } from '@phosphor-icons/react';
export { BookOpen as Book } from '@phosphor-icons/react';
export { Folder } from '@phosphor-icons/react';
export { At as AtSign } from '@phosphor-icons/react';
export { InstagramLogo as Instagram } from '@phosphor-icons/react';
export { FacebookLogo as Facebook } from '@phosphor-icons/react';
export { TwitterLogo as Twitter } from '@phosphor-icons/react';
export { YoutubeLogo as Youtube } from '@phosphor-icons/react';
export { Cursor as MousePointerClick } from '@phosphor-icons/react';
export { NumberCircleTwo as Hash2 } from '@phosphor-icons/react';
export { Storefront as Store } from '@phosphor-icons/react';
export { Key } from '@phosphor-icons/react';
export { ListChecks } from '@phosphor-icons/react';
export { TextHOne as Heading1 } from '@phosphor-icons/react';
export { Square } from '@phosphor-icons/react';
export { Layout as LayoutTemplate } from '@phosphor-icons/react';
export { ShieldCheck as ShieldCheckIcon } from '@phosphor-icons/react';

// ─── Type exports for components that type icons ───────────────────
export type { IconProps } from '@phosphor-icons/react';

// Compatibility type for components that used LucideIcon type
import type { IconProps } from '@phosphor-icons/react';
import type { ComponentType } from 'react';
export type LucideIcon = ComponentType<IconProps>;
