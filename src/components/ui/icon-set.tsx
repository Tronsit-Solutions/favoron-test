import React from "react";
import { 
  // Navigation & Actions
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  Plus,
  Minus,
  X,
  Check,
  Edit,
  Trash2,
  Save,
  Download,
  Upload,
  Search,
  Filter,
  Settings,
  Menu,
  MoreVertical,
  MoreHorizontal,
  
  // Status & Communication
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  MessageSquare,
  Bell,
  Eye,
  EyeOff,
  Clock,
  Calendar,
  
  // Business Logic
  Package,
  Truck,
  Plane,
  MapPin,
  Map,
  Users,
  User,
  Home,
  Building,
  CreditCard,
  DollarSign,
  Receipt,
  FileText,
  Camera,
  Image,
  
  // System
  Loader2,
  RefreshCw,
  Power,
  Wifi,
  WifiOff,
  Lock,
  Unlock,
  Shield,
  Star,
  Heart,
  Share,
  Link,
  Copy,
  
  type LucideIcon
} from "lucide-react";

// Organized icon collections for consistent usage
export const IconSet = {
  // Navigation icons
  navigation: {
    chevronLeft: ChevronLeft,
    chevronRight: ChevronRight,
    chevronDown: ChevronDown,
    chevronUp: ChevronUp,
    arrowLeft: ArrowLeft,
    arrowRight: ArrowRight,
    menu: Menu,
    more: MoreVertical,
    moreHorizontal: MoreHorizontal,
  },

  // Action icons
  actions: {
    add: Plus,
    remove: Minus,
    close: X,
    confirm: Check,
    edit: Edit,
    delete: Trash2,
    save: Save,
    download: Download,
    upload: Upload,
    search: Search,
    filter: Filter,
    settings: Settings,
    copy: Copy,
    share: Share,
  },

  // Status icons
  status: {
    success: CheckCircle,
    warning: AlertTriangle,
    error: XCircle,
    info: AlertCircle,
    pending: Clock,
    loading: Loader2,
    refresh: RefreshCw,
  },

  // Communication icons
  communication: {
    message: MessageSquare,
    notification: Bell,
    visible: Eye,
    hidden: EyeOff,
    info: Info,
  },

  // Business icons
  business: {
    package: Package,
    shipping: Truck,
    flight: Plane,
    location: MapPin,
    map: Map,
    users: Users,
    user: User,
    home: Home,
    building: Building,
    payment: CreditCard,
    money: DollarSign,
    receipt: Receipt,
    document: FileText,
    camera: Camera,
    image: Image,
  },

  // System icons
  system: {
    calendar: Calendar,
    power: Power,
    online: Wifi,
    offline: WifiOff,
    secure: Lock,
    unsecure: Unlock,
    protected: Shield,
    favorite: Star,
    like: Heart,
    link: Link,
  }
} as const;

// Helper type for icon names
export type IconName = keyof typeof IconSet[keyof typeof IconSet];

// Icon component with consistent sizing and styling
interface IconProps {
  name: string;
  category: keyof typeof IconSet;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'muted';
}

const sizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8'
};

const colorClasses = {
  default: 'text-foreground',
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
  muted: 'text-muted-foreground'
};

export const Icon: React.FC<IconProps> = ({ 
  name, 
  category, 
  size = 'md', 
  className = '', 
  color = 'default' 
}) => {
  const IconComponent = IconSet[category]?.[name as keyof typeof IconSet[typeof category]] as LucideIcon;
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in category "${category}"`);
    return null;
  }

  return (
    <IconComponent 
      className={`${sizeClasses[size]} ${colorClasses[color]} ${className}`}
    />
  );
};

// Predefined icon combinations for common use cases
export const StatusIcon: React.FC<{
  status: 'success' | 'warning' | 'error' | 'info' | 'pending';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ status, size = 'md', className = '' }) => {
  const colorMap = {
    success: 'success',
    warning: 'warning', 
    error: 'error',
    info: 'primary',
    pending: 'warning'
  } as const;
  
  return <Icon name={status} category="status" size={size} color={colorMap[status]} className={className} />;
};

export const ActionIcon: React.FC<{
  action: keyof typeof IconSet.actions;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'muted';
}> = ({ action, size = 'md', className = '', color = 'default' }) => {
  return <Icon name={action} category="actions" size={size} color={color} className={className} />;
};

export const BusinessIcon: React.FC<{
  icon: keyof typeof IconSet.business;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'muted';
}> = ({ icon, size = 'md', className = '', color = 'default' }) => {
  return <Icon name={icon} category="business" size={size} color={color} className={className} />;
};