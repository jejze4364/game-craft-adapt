import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Volume2, Zap, Gauge } from "lucide-react";

interface GameSettings {
  sound: boolean;
  animations: boolean;
  speed: number;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange
}) => {
  const updateSetting = (key: keyof GameSettings, value: boolean | number) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  const getSpeedLabel = (speed: number) => {
    if (speed <= 0.5) return "Lento";
    if (speed <= 1) return "Normal";
    if (speed <= 1.5) return "Rápido";
    return "Muito Rápido";
  };

  const getSpeedColor = (speed: number) => {
    if (speed <= 0.5) return "bg-ze-blue/20 text-ze-blue";
    if (speed <= 1) return "bg-ze-green/20 text-ze-green";
    if (speed <= 1.5) return "bg-ze-yellow/20 text-ze-yellow";
    return "bg-ze-red/20 text-ze-red";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card/95 backdrop-blur-sm border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="text-2xl">⚙️</span>
            Configurações do Jogo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Audio Settings */}
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <Volume2 className="h-5 w-5 text-ze-blue" />
              <h3 className="font-semibold">Áudio</h3>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="sound-toggle" className="text-sm">
                Sons do jogo
              </Label>
              <Switch
                id="sound-toggle"
                checked={settings.sound}
                onCheckedChange={(checked) => updateSetting("sound", checked)}
              />
            </div>
          </Card>

          {/* Visual Settings */}
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-ze-yellow" />
              <h3 className="font-semibold">Visual</h3>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="animations-toggle" className="text-sm">
                Animações
              </Label>
              <Switch
                id="animations-toggle"
                checked={settings.animations}
                onCheckedChange={(checked) => updateSetting("animations", checked)}
              />
            </div>
          </Card>

          {/* Performance Settings */}
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <Gauge className="h-5 w-5 text-ze-green" />
              <h3 className="font-semibold">Velocidade do Jogo</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Velocidade</Label>
                <Badge 
                  variant="outline" 
                  className={`${getSpeedColor(settings.speed)} border-current`}
                >
                  {getSpeedLabel(settings.speed)}
                </Badge>
              </div>
              
              <Slider
                value={[settings.speed]}
                onValueChange={(value) => updateSetting("speed", value[0])}
                max={2}
                min={0.25}
                step={0.25}
                className="w-full"
              />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.25x</span>
                <span>1x</span>
                <span>2x</span>
              </div>
            </div>
          </Card>

          {/* Game Info */}
          <Card className="p-4 bg-muted/20 border-muted/40">
            <h3 className="font-semibold mb-3 text-sm">Sobre o Simulador</h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>• 15 checkpoints educativos</p>
              <p>• Sistema de KPIs real do Zé Delivery</p>
              <p>• Controles: WASD ou setas</p>
              <p>• Tecla I para inspeção</p>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="game-secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            
            <Button
              variant="game"
              onClick={onClose}
              className="flex-1"
            >
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};