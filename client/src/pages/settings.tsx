import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Settings() {
  const [settings, setSettings] = useState({
    companyName: "Order Management System",
    autoPrint: true
  });

  const handleSave = () => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>
      
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={settings.companyName}
              onChange={(e) => setSettings({...settings, companyName: e.target.value})}
              placeholder="Enter company name"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label>Auto Print PDFs</Label>
            <input
              type="checkbox"
              checked={settings.autoPrint}
              onChange={(e) => setSettings({...settings, autoPrint: e.target.checked})}
              className="w-4 h-4"
            />
          </div>

          <Button onClick={handleSave} className="w-full">
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}