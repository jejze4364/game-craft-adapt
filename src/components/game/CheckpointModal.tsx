import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Lightbulb } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CheckpointData {
  id: number;
  video: string;
  context: string;
  situation: string;
  options: string[];
  correct: number | string;
  hint: string;
  type?: "text" | "multiple";
}

interface CheckpointModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkpoint: CheckpointData | null;
  onAnswer: (checkpointId: number, isCorrect: boolean) => void;
}

export const CheckpointModal: React.FC<CheckpointModalProps> = ({
  isOpen,
  onClose,
  checkpoint,
  onAnswer
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [textAnswer, setTextAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);

  if (!checkpoint) return null;

  const isTextType = checkpoint.type === "text";
  const currentAnswer = isTextType ? textAnswer : selectedAnswer;
  const questionUnlocked = videoCompleted;

  const handleSubmit = () => {
    if (!showQuestion) {
      return;
    }

    let correct = false;

    if (isTextType) {
      correct = textAnswer.toLowerCase().trim() === String(checkpoint.correct).toLowerCase();
    } else {
      correct = parseInt(selectedAnswer) === checkpoint.correct;
    }

    setIsCorrect(correct);
    setShowResult(true);

    onAnswer(checkpoint.id, correct);

    if (correct) {
      setTimeout(() => {
        handleClose();
      }, 2000);
    }
  };

  const handleClose = () => {
    setSelectedAnswer("");
    setTextAnswer("");
    setShowResult(false);
    setIsCorrect(false);
    setShowHint(false);
    setVideoCompleted(false);
    setVideoProgress(0);
    setShowQuestion(false);
    onClose();
  };

  const handleRetry = () => {
    setShowResult(false);
    setIsCorrect(false);
    setShowHint(false);
    setSelectedAnswer("");
    setTextAnswer("");
    setShowQuestion(false);
  };

  const handleVideoTimeUpdate = (event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = event.currentTarget;
    if (!video.duration) return;

    const progress = Math.min(100, Math.round((video.currentTime / video.duration) * 100));
    setVideoProgress(progress);
  };

  const handleVideoEnded = () => {
    setVideoCompleted(true);
    setVideoProgress(100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-sm border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="text-2xl">🍺</span>
            Checkpoint #{checkpoint.id + 1}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Video Section */}
          <Card className="p-4 bg-bg-secondary/50 border-border/50">
            <div className="space-y-3">
              <div className="aspect-video bg-bg-tertiary rounded-lg overflow-hidden">
                <video
                  controls
                  className="w-full h-full object-cover"
                  poster="/videos/thumbnail-default.jpg"
                  onTimeUpdate={handleVideoTimeUpdate}
                  onEnded={handleVideoEnded}
                >
                  <source src={`/videos/${String(checkpoint.id + 1).padStart(2, '0')}-${checkpoint.video.toLowerCase().replace(/\s+/g, '-')}.mp4`} type="video/mp4" />
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-muted-foreground">
                      <div className="text-4xl mb-2">🎥</div>
                      <p className="text-sm">Vídeo Educativo</p>
                      <p className="text-xs opacity-75">{checkpoint.video}</p>
                    </div>
                  </div>
                </video>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progresso do vídeo</span>
                  <span>{videoProgress}%</span>
                </div>
                <Progress value={videoProgress} className="h-2" />
                {!videoCompleted && (
                  <p className="text-[11px] text-muted-foreground/80">
                    Assista ao vídeo até o fim para liberar o botão "Responder Pergunta".
                  </p>
                )}
                {videoCompleted && !showQuestion && (
                  <div className="pt-2">
                    <Button
                      onClick={() => setShowQuestion(true)}
                      className="w-full bg-gradient-primary hover:shadow-glow-strong transition-all duration-200"
                    >
                      Responder Pergunta
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Context and Question - Only show after "Responder Pergunta" */}
          {showQuestion && (
            <>
              <Card className="p-4 bg-ze-yellow/10 border-ze-yellow/30">
                <h3 className="font-semibold text-ze-yellow mb-2">Contexto</h3>
                <p className="text-foreground">{checkpoint.context}</p>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold text-foreground mb-3">{checkpoint.situation}</h3>
                
                {showResult ? (
                  <div className={`p-4 rounded-lg border-2 ${
                    isCorrect
                      ? "bg-ze-green/10 border-ze-green text-ze-green"
                      : "bg-ze-red/10 border-ze-red text-ze-red"
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <XCircle className="h-5 w-5" />
                      )}
                      <span className="font-semibold">
                        {isCorrect ? "Correto!" : "Incorreto!"}
                      </span>
                    </div>
                    <p className="text-sm opacity-90">
                      {isCorrect
                        ? "Parabéns! Você domina essa prática do Zé Delivery."
                        : "Reveja os pontos principais do vídeo, ajuste sua estratégia e tente novamente."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {isTextType ? (
                      <div>
                        <Label htmlFor="textAnswer" className="text-sm font-medium">
                          Digite sua resposta:
                        </Label>
                        <Input
                          id="textAnswer"
                          value={textAnswer}
                          onChange={(e) => setTextAnswer(e.target.value)}
                          placeholder="Digite aqui..."
                          className="mt-1"
                        />
                      </div>
                    ) : (
                      <RadioGroup
                        value={selectedAnswer}
                        onValueChange={setSelectedAnswer}
                      >
                        {checkpoint.options.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <RadioGroupItem
                              value={index.toString()}
                              id={`option-${index}`}
                            />
                            <Label
                              htmlFor={`option-${index}`}
                              className="flex-1 cursor-pointer"
                            >
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    {showHint && (
                      <Card className="p-3 bg-ze-blue/10 border-ze-blue/30">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-ze-blue mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-ze-blue">Dica</p>
                            <p className="text-sm text-foreground">{checkpoint.hint}</p>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                )}
              </Card>
            </>
          )}

          {/* Actions */}
          {showQuestion && !showResult ? (
            <div className="flex gap-3">
              <Button
                variant="game-secondary"
                onClick={() => setShowHint(!showHint)}
                className="flex-1"
              >
                <Lightbulb className="h-4 w-4" />
                {showHint ? "Ocultar Dica" : "Mostrar Dica"}
              </Button>

              <Button
                variant="game"
                onClick={handleSubmit}
                disabled={!currentAnswer.trim()}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4" />
                Confirmar Resposta
              </Button>
            </div>
          ) : showResult && !isCorrect ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="game-secondary"
                onClick={() => setShowHint(true)}
                className="flex-1"
              >
                <Lightbulb className="h-4 w-4" />
                Revisar dica
              </Button>
              <Button
                variant="game"
                onClick={handleRetry}
                className="flex-1"
              >
                <XCircle className="h-4 w-4" />
                Tentar novamente
              </Button>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};