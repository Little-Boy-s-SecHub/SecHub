import { 
  Database, 
  Code, 
  Shuffle, 
  Key, 
  Server, 
  Terminal, 
  Upload, 
  Unlock,
  AlertCircle
} from 'lucide-react';

interface VulnIconProps {
  name: string;
  className?: string;
  size?: number;
}

export default function VulnIcon({ name, className, size = 20 }: VulnIconProps) {
  switch (name) {
    case 'database':
      return <Database className={className} size={size} />;
    case 'code':
      return <Code className={className} size={size} />;
    case 'shuffle':
      return <Shuffle className={className} size={size} />;
    case 'key':
      return <Key className={className} size={size} />;
    case 'server':
      return <Server className={className} size={size} />;
    case 'terminal':
      return <Terminal className={className} size={size} />;
    case 'upload':
      return <Upload className={className} size={size} />;
    case 'unlock':
      return <Unlock className={className} size={size} />;
    default:
      return <AlertCircle className={className} size={size} />;
  }
}
