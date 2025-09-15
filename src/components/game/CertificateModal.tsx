import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Trophy, Star, Clock, Target } from 'lucide-react';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerData: {
    name: string;
    email: string;
    score: number;
    totalTime: number;
    accuracy: number;
    deliveryEfficiency: number;
    customerSatisfaction: number;
  };
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  playerData
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatDate = (): string => {
    return new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const downloadCertificate = async () => {
    if (!certificateRef.current) return;

    try {
      // Import html2canvas dynamically
      const html2canvas = await import('html2canvas');
      const canvas = await html2canvas.default(certificateRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `certificado-ze-delivery-${playerData.name.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error generating certificate:', error);
      // Fallback: open certificate in new window for manual save
      const printWindow = window.open('', '_blank');
      if (printWindow && certificateRef.current) {
        printWindow.document.write(`
          <html>
            <head><title>Certificado Zé Delivery</title></head>
            <body style="margin: 0; padding: 20px;">
              ${certificateRef.current.outerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Trophy className="w-6 h-6 text-ze-yellow" />
            Parabéns! Certificado de Conclusão
          </DialogTitle>
        </DialogHeader>

        <div 
          ref={certificateRef}
          className="bg-white p-12 rounded-xl shadow-lg border-4 border-ze-yellow text-gray-800"
          style={{ fontFamily: 'serif' }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-4xl font-bold text-ze-red mb-2">ZÉ DELIVERY</div>
            <div className="text-xl text-ze-blue">SIMULADOR DE ENTREGADOR</div>
            <div className="w-32 h-1 bg-gradient-to-r from-ze-yellow to-ze-red mx-auto mt-4"></div>
          </div>

          {/* Certificate Title */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">CERTIFICADO DE CONCLUSÃO</h2>
            <p className="text-lg text-gray-600">
              Certificamos que
            </p>
          </div>

          {/* Player Name */}
          <div className="text-center mb-8">
            <div className="text-4xl font-bold text-ze-blue border-b-2 border-ze-yellow pb-2 inline-block px-8">
              {playerData.name}
            </div>
          </div>

          {/* Achievement Text */}
          <div className="text-center mb-8">
            <p className="text-xl text-gray-700 leading-relaxed">
              completou com sucesso todos os <strong>15 checkpoints</strong> do<br />
              <strong>Simulador de Entregador Zé Delivery</strong>,<br />
              demonstrando conhecimento operacional e excelência em entregas.
            </p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 bg-gray-50 p-6 rounded-lg">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="w-6 h-6 text-ze-yellow mr-2" />
                <span className="font-semibold">Pontuação</span>
              </div>
              <div className="text-2xl font-bold text-ze-red">{playerData.score}</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-6 h-6 text-ze-blue mr-2" />
                <span className="font-semibold">Tempo</span>
              </div>
              <div className="text-2xl font-bold text-ze-blue">{formatTime(playerData.totalTime)}</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-6 h-6 text-ze-green mr-2" />
                <span className="font-semibold">Precisão</span>
              </div>
              <div className="text-2xl font-bold text-ze-green">{playerData.accuracy}%</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="w-6 h-6 text-ze-yellow mr-2" />
                <span className="font-semibold">Satisfação</span>
              </div>
              <div className="text-2xl font-bold text-ze-yellow">{playerData.customerSatisfaction}%</div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-end mt-12">
            <div className="text-center">
              <div className="w-48 border-t-2 border-gray-400 pt-2">
                <div className="font-semibold">Zé Delivery</div>
                <div className="text-sm text-gray-600">Plataforma de Ensino</div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-lg font-semibold text-gray-700">
                {formatDate()}
              </div>
              <div className="text-sm text-gray-600">Data de Conclusão</div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-4 left-4 w-16 h-16 border-4 border-ze-yellow rounded-full opacity-20"></div>
          <div className="absolute top-4 right-4 w-16 h-16 border-4 border-ze-red rounded-full opacity-20"></div>
          <div className="absolute bottom-4 left-4 w-12 h-12 border-4 border-ze-blue rounded-full opacity-20"></div>
          <div className="absolute bottom-4 right-4 w-12 h-12 border-4 border-ze-green rounded-full opacity-20"></div>
        </div>

        {/* Download Button */}
        <div className="flex justify-center gap-4 mt-6">
          <Button onClick={downloadCertificate} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Baixar Certificado
          </Button>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};