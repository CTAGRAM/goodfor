/**
 * Icon mapping utility
 * Maps Iconify icon names to Lucide React Native components
 */

import {
    Home,
    History,
    QrCode,
    Heart,
    Settings,
    ArrowLeft,
    ArrowRight,
    Camera,
    Flashlight,
    Info,
    CheckCircle,
    AlertTriangle,
    Shield,
    ShieldCheck,
    FileText,
    User,
    Users,
    PlusCircle,
    ChevronDown,
    Search,
    Filter,
    Star,
    Play,
    Bell,
    CreditCard,
    HelpCircle,
    LogOut,
    Edit,
    Trash2,
    Download,
    Share2,
    X,
    Check,
    ChevronRight,
    Menu,
    MoreVertical,
    Send,
    Mic,
    Image as ImageIcon,
    Upload,
    Calendar,
    Clock,
    MapPin,
    Phone,
    Mail,
    Lock,
    Eye,
    EyeOff,
} from 'lucide-react-native';

/**
 * Icon component mapping
 * Maps Iconify icon names (from web design) to Lucide React Native components
 */
export const iconMap = {
    // Navigation
    'solar:home-2-bold': Home,
    'solar:home-2-linear': Home,
    'solar:history-linear': History,
    'solar:qr-code-bold': QrCode,
    'solar:heart-linear': Heart,
    'solar:heart-bold': Heart,
    'solar:settings-linear': Settings,
    'solar:settings-bold': Settings,

    // Arrows
    'solar:arrow-left-linear': ArrowLeft,
    'solar:arrow-right-linear': ArrowRight,
    'solar:alt-arrow-right-linear': ArrowRight,
    'solar:alt-arrow-down-linear': ChevronDown,

    // Camera & Media
    'solar:camera-minimalistic-bold': Camera,
    'solar:flashlight-bold': Flashlight,
    'solar:gallery-bold': ImageIcon,

    // Info & Status
    'solar:info-circle-linear': Info,
    'solar:info-circle-bold': Info,
    'solar:check-circle-bold': CheckCircle,
    'solar:check-read-bold': CheckCircle,
    'solar:danger-triangle-bold': AlertTriangle,

    // Security & Protection
    'solar:shield-user-bold': Shield,
    'solar:shield-check-bold': ShieldCheck,

    // Documents
    'solar:document-text-bold': FileText,

    // Users
    'solar:user-bold': User,
    'solar:users-group-rounded-bold': Users,

    // Actions
    'solar:add-circle-bold': PlusCircle,
    'solar:play-bold': Play,

    // Common
    'solar:star-bold': Star,
    'solar:bell-bold': Bell,
    'solar:notification-bold': Bell,

    // Fallback icons
    search: Search,
    filter: Filter,
    'credit-card': CreditCard,
    'help-circle': HelpCircle,
    'log-out': LogOut,
    edit: Edit,
    trash: Trash2,
    download: Download,
    share: Share2,
    x: X,
    check: Check,
    'chevron-right': ChevronRight,
    menu: Menu,
    'more-vertical': MoreVertical,
    send: Send,
    mic: Mic,
    upload: Upload,
    calendar: Calendar,
    clock: Clock,
    'map-pin': MapPin,
    phone: Phone,
    mail: Mail,
    lock: Lock,
    eye: Eye,
    'eye-off': EyeOff,
};

/**
 * Get icon component by name
 * @param {string} iconName - Iconify icon name or fallback name
 * @returns {React.Component} Lucide icon component
 */
export const getIcon = (iconName) => {
    return iconMap[iconName] || Info; // Default to Info icon if not found
};

export default iconMap;
