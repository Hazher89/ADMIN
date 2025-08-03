'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  Settings, 
  Bell, 
  UserPlus, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Send,
  Save,
  TestTube,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';

interface EmailSettings {
  // General settings
  enabled: boolean;
  fromEmail: string;
  fromName: string;
  
  // Email type toggles
  adminSetup: boolean;
  deviationReports: boolean;
  deviationResolved: boolean;
  userWelcome: boolean;
  notifications: boolean;
  warnings: boolean;
  systemAlerts: boolean;
  
  // Templates
  adminSetupTemplate: string;
  deviationReportTemplate: string;
  deviationResolvedTemplate: string;
  userWelcomeTemplate: string;
  notificationTemplate: string;
  warningTemplate: string;
  systemAlertTemplate: string;
  
  // SMTP settings
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpSecure: boolean;
  
  // Advanced settings
  retryAttempts: number;
  retryDelay: number;
  maxEmailsPerHour: number;
  logAllEmails: boolean;
}

interface EmailLog {
  id: string;
  to: string[];
  subject: string;
  type: string;
  status: 'sent' | 'failed' | 'pending';
  sentAt: string;
  error?: string;
  metadata?: Record<string, any>;
}

export default function EmailControlPage() {
  const { userProfile } = useAuth();
  const [settings, setSettings] = useState<EmailSettings>({
    enabled: true,
    fromEmail: 'noreply@driftpro.no',
    fromName: 'DriftPro System',
    adminSetup: true,
    deviationReports: true,
    deviationResolved: true,
    userWelcome: true,
    notifications: true,
    warnings: true,
    systemAlerts: true,
    adminSetupTemplate: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Velkommen til DriftPro</title>
</head>
<body>
  <h1>Velkommen til DriftPro</h1>
  <p>Hei {{adminName}},</p>
  <p>Du har blitt utnevnt som administrator for {{companyName}}.</p>
  <p>Klikk på lenken nedenfor for å sette opp passordet ditt:</p>
  <a href="{{setupUrl}}">Sett opp passord</a>
  <p>Lenken utløper om 24 timer.</p>
  <p>Med vennlig hilsen,<br>DriftPro Team</p>
</body>
</html>`,
    deviationReportTemplate: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ny avviksrapport</title>
</head>
<body>
  <h1>Ny avviksrapport</h1>
  <p>Et nytt avvik har blitt rapportert:</p>
  <ul>
    <li><strong>Avvik:</strong> {{deviationTitle}}</li>
    <li><strong>Beskrivelse:</strong> {{deviationDescription}}</li>
    <li><strong>Rapportert av:</strong> {{reportedBy}}</li>
    <li><strong>Dato:</strong> {{reportedDate}}</li>
    <li><strong>Prioritet:</strong> {{priority}}</li>
  </ul>
  <p>Klikk <a href="{{deviationUrl}}">her</a> for å se detaljer.</p>
</body>
</html>`,
    deviationResolvedTemplate: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Avvik løst</title>
</head>
<body>
  <h1>Avvik løst</h1>
  <p>Følgende avvik har blitt løst:</p>
  <ul>
    <li><strong>Avvik:</strong> {{deviationTitle}}</li>
    <li><strong>Løst av:</strong> {{resolvedBy}}</li>
    <li><strong>Dato:</strong> {{resolvedDate}}</li>
    <li><strong>Løsning:</strong> {{resolution}}</li>
  </ul>
</body>
</html>`,
    userWelcomeTemplate: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Velkommen til DriftPro</title>
</head>
<body>
  <h1>Velkommen til DriftPro</h1>
  <p>Hei {{userName}},</p>
  <p>Velkommen til {{companyName}} på DriftPro!</p>
  <p>Din konto er nå aktiv og du kan logge inn på systemet.</p>
  <p>Med vennlig hilsen,<br>DriftPro Team</p>
</body>
</html>`,
    notificationTemplate: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{{subject}}</title>
</head>
<body>
  <h1>{{subject}}</h1>
  <p>{{message}}</p>
  <p>Med vennlig hilsen,<br>DriftPro Team</p>
</body>
</html>`,
    warningTemplate: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Advarsel - {{subject}}</title>
</head>
<body>
  <h1>Advarsel</h1>
  <p>{{message}}</p>
  <p>Dette er en automatisk advarsel fra DriftPro-systemet.</p>
</body>
</html>`,
    systemAlertTemplate: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Systemadvarsel</title>
</head>
<body>
  <h1>Systemadvarsel</h1>
  <p>{{message}}</p>
  <p>Dette er en systemadvarsel fra DriftPro.</p>
</body>
</html>`,
    smtpHost: 'smtp.office365.com',
    smtpPort: 587,
    smtpUser: 'noreply@driftpro.no',
    smtpSecure: false,
    retryAttempts: 3,
    retryDelay: 5000,
    maxEmailsPerHour: 100,
    logAllEmails: true
  });
  
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testType, setTestType] = useState('notification');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [smtpPassword, setSmtpPassword] = useState('');

  // Load settings from Firebase
  useEffect(() => {
    loadEmailSettings();
    loadEmailLogs();
  }, []);

  const loadEmailSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/email-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Error loading email settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmailLogs = async () => {
    try {
      const response = await fetch('/api/email-logs');
      if (response.ok) {
        const data = await response.json();
        setEmailLogs(data);
      }
    } catch (error) {
      console.error('Error loading email logs:', error);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/email-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          smtpPassword: smtpPassword || undefined
        })
      });
      
      if (response.ok) {
        setMessage('Innstillinger lagret!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Feil ved lagring av innstillinger');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Feil ved lagring av innstillinger');
    } finally {
      setSaving(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail || !testType) {
      setMessage('Vennligst fyll ut e-post og velg type');
      return;
    }

    try {
      setTesting(true);
      const response = await fetch('/api/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail,
          type: testType,
          settings
        })
      });
      
      if (response.ok) {
        setMessage('Test-e-post sendt!');
        setTestEmail('');
      } else {
        const error = await response.json();
        setMessage(`Feil: ${error.error}`);
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      setMessage('Feil ved sending av test-e-post');
    } finally {
      setTesting(false);
    }
  };

  const toggleEmailType = (type: keyof EmailSettings) => {
    setSettings(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const updateTemplate = (templateKey: keyof EmailSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [templateKey]: value
    }));
  };

  if (!userProfile || userProfile.role !== 'super_admin') {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Du har ikke tilgang til denne siden. Kun super-administratorer kan konfigurere e-post-innstillinger.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">E-post-kontroll</h1>
          <p className="text-muted-foreground">
            Full kontroll over alle e-poster som sendes i systemet
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={settings.enabled ? "default" : "secondary"}>
            {settings.enabled ? "Aktiv" : "Inaktiv"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={loadEmailLogs}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Oppdater logger
          </Button>
        </div>
      </div>

      {message && (
        <Alert>
          {message.includes('Feil') ? (
            <XCircle className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings">Innstillinger</TabsTrigger>
          <TabsTrigger value="templates">Maler</TabsTrigger>
          <TabsTrigger value="smtp">SMTP</TabsTrigger>
          <TabsTrigger value="logs">E-post-logger</TabsTrigger>
          <TabsTrigger value="test">Test</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Generelle innstillinger
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enabled">Aktiver e-post-system</Label>
                  <p className="text-sm text-muted-foreground">
                    Slå av/på hele e-post-systemet
                  </p>
                </div>
                <Switch
                  id="enabled"
                  checked={settings.enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fromEmail">Avsender e-post</Label>
                  <Input
                    id="fromEmail"
                    value={settings.fromEmail}
                    onChange={(e) => setSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                    placeholder="noreply@driftpro.no"
                  />
                </div>
                <div>
                  <Label htmlFor="fromName">Avsender navn</Label>
                  <Input
                    id="fromName"
                    value={settings.fromName}
                    onChange={(e) => setSettings(prev => ({ ...prev, fromName: e.target.value }))}
                    placeholder="DriftPro System"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                E-post-typer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <UserPlus className="h-5 w-5 text-blue-500" />
                    <div>
                      <Label htmlFor="adminSetup">Admin-oppsett</Label>
                      <p className="text-sm text-muted-foreground">
                        E-post til nye administratorer
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="adminSetup"
                    checked={settings.adminSetup}
                    onCheckedChange={() => toggleEmailType('adminSetup')}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <div>
                      <Label htmlFor="deviationReports">Avviksrapporter</Label>
                      <p className="text-sm text-muted-foreground">
                        Nye avviksrapporter
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="deviationReports"
                    checked={settings.deviationReports}
                    onCheckedChange={() => toggleEmailType('deviationReports')}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <Label htmlFor="deviationResolved">Avvik løst</Label>
                      <p className="text-sm text-muted-foreground">
                        Når avvik blir løst
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="deviationResolved"
                    checked={settings.deviationResolved}
                    onCheckedChange={() => toggleEmailType('deviationResolved')}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-purple-500" />
                    <div>
                      <Label htmlFor="userWelcome">Velkomstmeldinger</Label>
                      <p className="text-sm text-muted-foreground">
                        Velkomst til nye brukere
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="userWelcome"
                    checked={settings.userWelcome}
                    onCheckedChange={() => toggleEmailType('userWelcome')}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Bell className="h-5 w-5 text-orange-500" />
                    <div>
                      <Label htmlFor="notifications">Varsler</Label>
                      <p className="text-sm text-muted-foreground">
                        Generelle varsler
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="notifications"
                    checked={settings.notifications}
                    onCheckedChange={() => toggleEmailType('notifications')}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <div>
                      <Label htmlFor="warnings">Advarsler</Label>
                      <p className="text-sm text-muted-foreground">
                        Systemadvarsler
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="warnings"
                    checked={settings.warnings}
                    onCheckedChange={() => toggleEmailType('warnings')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={saveSettings} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Lagrer...' : 'Lagre innstillinger'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>E-post-maler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="adminSetupTemplate">Admin-oppsett mal</Label>
                <Textarea
                  id="adminSetupTemplate"
                  value={settings.adminSetupTemplate}
                  onChange={(e) => updateTemplate('adminSetupTemplate', e.target.value)}
                  rows={10}
                  placeholder="HTML-mal for admin-oppsett e-post..."
                />
              </div>

              <div>
                <Label htmlFor="deviationReportTemplate">Avviksrapport mal</Label>
                <Textarea
                  id="deviationReportTemplate"
                  value={settings.deviationReportTemplate}
                  onChange={(e) => updateTemplate('deviationReportTemplate', e.target.value)}
                  rows={10}
                  placeholder="HTML-mal for avviksrapport e-post..."
                />
              </div>

              <div>
                <Label htmlFor="notificationTemplate">Varsel mal</Label>
                <Textarea
                  id="notificationTemplate"
                  value={settings.notificationTemplate}
                  onChange={(e) => updateTemplate('notificationTemplate', e.target.value)}
                  rows={8}
                  placeholder="HTML-mal for varsel e-post..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="smtp" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SMTP-innstillinger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtpHost">SMTP-server</Label>
                  <Input
                    id="smtpHost"
                    value={settings.smtpHost}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                    placeholder="smtp.office365.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPort">Port</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={settings.smtpPort}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtpPort: parseInt(e.target.value) }))}
                    placeholder="587"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtpUser">Brukernavn</Label>
                  <Input
                    id="smtpUser"
                    value={settings.smtpUser}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtpUser: e.target.value }))}
                    placeholder="noreply@driftpro.no"
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPassword">Passord</Label>
                  <div className="relative">
                    <Input
                      id="smtpPassword"
                      type={showPassword ? "text" : "password"}
                      value={smtpPassword}
                      onChange={(e) => setSmtpPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="smtpSecure"
                  checked={settings.smtpSecure}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, smtpSecure: checked }))}
                />
                <Label htmlFor="smtpSecure">Bruk SSL/TLS</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>E-post-logger</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {emailLogs.length === 0 ? (
                  <p className="text-muted-foreground">Ingen e-post-logger funnet</p>
                ) : (
                  emailLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Badge variant={log.status === 'sent' ? 'default' : 'destructive'}>
                            {log.status === 'sent' ? 'Sendt' : log.status === 'failed' ? 'Feilet' : 'Venter'}
                          </Badge>
                          <span className="font-medium">{log.type}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Til: {log.to.join(', ')}
                        </p>
                        <p className="text-sm mt-1">{log.subject}</p>
                        {log.error && (
                          <p className="text-sm text-red-500 mt-1">Feil: {log.error}</p>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(log.sentAt).toLocaleString('nb-NO')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TestTube className="h-5 w-5 mr-2" />
                Test e-post
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="testEmail">Mottaker e-post</Label>
                  <Input
                    id="testEmail"
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="testType">E-post-type</Label>
                  <Select value={testType} onValueChange={setTestType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin_setup">Admin-oppsett</SelectItem>
                      <SelectItem value="deviation_report">Avviksrapport</SelectItem>
                      <SelectItem value="notification">Varsel</SelectItem>
                      <SelectItem value="warning">Advarsel</SelectItem>
                      <SelectItem value="welcome">Velkomst</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={sendTestEmail} disabled={testing || !testEmail}>
                <Send className="h-4 w-4 mr-2" />
                {testing ? 'Sender...' : 'Send test-e-post'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 