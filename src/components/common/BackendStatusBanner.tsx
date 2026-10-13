import React, { useState } from 'react';
import { Database, AlertTriangle, CheckCircle2, ChevronRight, X, ExternalLink, Copy } from 'lucide-react';
import { getSupabaseConfig, isSupabaseConfigured, getSupabaseSetupStatus } from '../../lib/supabaseClient';

interface Props {
  onOpenSetupGuide?: () => void;
}

export const BackendStatusBanner: React.FC<Props> = () => {
  return null;
};
