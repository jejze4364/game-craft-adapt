import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

interface GameStats {
  lives: number;
  score: number;
  completedTasks: number;
  accuracy: number;
  sessionTime: string;
}

interface KPIData {
  disponibilidade: number;
  aceitacao: number;
  tempoEntrega: number;
  avaliacao: number;
}

interface GameHUDProps {
  userEmail: string;
  stats: GameStats;
  kpis: KPIData;
  onSettingsClick: () => void;
}

const KPICard: React.FC<{ label: string; value: number; icon: string }> = ({ 
  label, 
  value, 
  icon 
}) => {
  const getKPIColor = (value: number) => {
    if (value >= 90) return "text-ze-green";
    if (value >= 70) return "text-ze-yellow";
    return "text-ze-red";
  };

  const getKPIBg = (value: number) => {
    if (value >= 90) return "bg-ze-green/10";
    if (value >= 70) return "bg-ze-yellow/10";
    return "bg-ze-red/10";
  };

  return (
    <Card className={`p-3 ${getKPIBg(value)} border-border/50`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-sm">{icon}</span>
      </div>
      <div className={`text-xl font-bold ${getKPIColor(value)}`}>
        {value}%
      </div>
      <div className="w-full bg-muted/30 rounded-full h-1 mt-1">
        <div 
          className={`h-1 rounded-full transition-all duration-500 ${
            value >= 90 ? "bg-ze-green" : 
            value >= 70 ? "bg-ze-yellow" : "bg-ze-red"
          }`}
          style={{ width: `${value}%` }}
        />
      </div>
    </Card>
  );
};

export const GameHUD: React.FC<GameHUDProps> = ({
  userEmail,
  stats,
  kpis,
  onSettingsClick
}) => {
  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Lives */}
            <div className="flex items-center gap-2">
              <span className="text-2xl">❤️</span>
              <div>
                <div className="text-2xl font-bold text-ze-red">{stats.lives}</div>
                <div className="text-xs text-muted-foreground">Vidas</div>
              </div>
            </div>
            
            {/* Score */}
            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <div>
                <div className="text-2xl font-bold text-ze-yellow">{stats.score}</div>
                <div className="text-xs text-muted-foreground">Pontos</div>
              </div>
            </div>
          </div>

          {/* User & Settings */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-foreground">{userEmail}</div>
              <div className="text-xs text-muted-foreground">Jogador</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSettingsClick}
              className="hover:bg-secondary/80"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* KPI Grid */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">KPIs de Performance</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard 
            label="Disponibilidade" 
            value={kpis.disponibilidade} 
            icon="🕒" 
          />
          <KPICard 
            label="Taxa Aceitação" 
            value={kpis.aceitacao} 
            icon="✅" 
          />
          <KPICard 
            label="Tempo Entrega" 
            value={kpis.tempoEntrega} 
            icon="🚚" 
          />
          <KPICard 
            label="Avaliação" 
            value={kpis.avaliacao} 
            icon="⭐" 
          />
        </div>
      </div>

      {/* Session Stats */}
      <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
        <h3 className="text-lg font-semibold text-foreground mb-3">Estatísticas da Sessão</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-ze-green">{stats.completedTasks}</div>
            <div className="text-sm text-muted-foreground">Tarefas Concluídas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-ze-blue">{stats.accuracy}%</div>
            <div className="text-sm text-muted-foreground">Precisão</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{stats.sessionTime}</div>
            <div className="text-sm text-muted-foreground">Tempo de Jogo</div>
          </div>
        </div>
      </Card>
    </div>
  );
};