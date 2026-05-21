import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PURPOSE_LABELS, type QuestionPurpose } from "@/lib/form-templates";
import { SortableQuestionRow } from "./SortableQuestionRow";
import { questionTypes, type FormSettings, type Question } from "./types";

interface Props {
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  selectedQuestion: string | null;
  setSelectedQuestion: (id: string | null) => void;
  settings: FormSettings;
  setSettings: React.Dispatch<React.SetStateAction<FormSettings>>;
}

export function ContentTab({
  questions,
  setQuestions,
  selectedQuestion,
  setSelectedQuestion,
  settings,
  setSettings,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((q) => q.id === active.id);
        const newIndex = items.findIndex((q) => q.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addQuestion = (type: string) => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type: type as Question["type"],
      question: "New question",
      required: false,
    };
    setQuestions([...questions, newQuestion]);
    setSelectedQuestion(newQuestion.id);
  };

  const deleteQuestion = (qId: string) => {
    setQuestions(questions.filter((q) => q.id !== qId));
    if (selectedQuestion === qId) setSelectedQuestion(null);
  };

  const selected = selectedQuestion ? questions.find((qq) => qq.id === selectedQuestion) : null;
  const updateSelected = (patch: Partial<Question>) => {
    if (!selected) return;
    setQuestions(questions.map((qq) => (qq.id === selected.id ? { ...qq, ...patch } : qq)));
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-xl">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Questions</h3>
            <span className="text-xs text-muted-foreground">{questions.length} total</span>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {questions.map((q) => (
                  <SortableQuestionRow
                    key={q.id}
                    q={q}
                    Icon={questionTypes.find((t) => t.type === q.type)?.icon}
                    selected={selectedQuestion === q.id}
                    onSelect={() => setSelectedQuestion(q.id)}
                    onDelete={() => deleteQuestion(q.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Add a question</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {questionTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Button
                    key={type.type}
                    variant="outline"
                    size="sm"
                    className="flex-col h-16 gap-1"
                    onClick={() => addQuestion(type.type)}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px]">{type.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {selected && (
        <Card className="border-primary rounded-xl">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Edit question</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedQuestion(null)}>Done</Button>
            </div>
            <div className="space-y-3">
              <div>
                <Label>Type</Label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mt-1">
                  {questionTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.type}
                        onClick={() => updateSelected({ type: type.type as Question["type"] })}
                        className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-colors ${selected.type === type.type ? "border-primary bg-primary/10" : "border-border hover:border-border-hover"}`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[10px] text-muted-foreground">{type.label.split(" ")[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label>Question text</Label>
                <Input value={selected.question} onChange={(e) => updateSelected({ question: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Placeholder</Label>
                <Input value={selected.placeholder || ""} onChange={(e) => updateSelected({ placeholder: e.target.value })} placeholder="e.g. Tell us about…" className="mt-1" />
              </div>
              <div>
                <Label>Help text</Label>
                <Textarea
                  value={selected.helpText || ""}
                  onChange={(e) => updateSelected({ helpText: e.target.value })}
                  placeholder="Coaching shown under the question to encourage specific, honest answers…"
                  rows={2}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Purpose</Label>
                <select
                  className="w-full mt-1 p-2 rounded-lg border border-border bg-card text-sm"
                  value={selected.purpose ?? "open"}
                  onChange={(e) => updateSelected({ purpose: e.target.value as QuestionPurpose })}
                >
                  {(Object.keys(PURPOSE_LABELS) as QuestionPurpose[]).map((p) => (
                    <option key={p} value={p}>{PURPOSE_LABELS[p]}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Required</Label>
                <Switch checked={selected.required} onCheckedChange={(checked) => updateSelected({ required: checked })} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-xl">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Welcome screen</h3>
            <Switch checked={settings.welcomeEnabled} onCheckedChange={(checked) => setSettings({ ...settings, welcomeEnabled: checked })} />
          </div>
          {settings.welcomeEnabled && (
            <div className="space-y-3">
              <Input value={settings.welcomeTitle} onChange={(e) => setSettings({ ...settings, welcomeTitle: e.target.value })} placeholder="Welcome title" />
              <Textarea value={settings.welcomeMessage} onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })} placeholder="Welcome message" rows={3} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Thank-you screen</h3>
          <div className="space-y-3">
            <Input value={settings.thankYouTitle} onChange={(e) => setSettings({ ...settings, thankYouTitle: e.target.value })} placeholder="Thank you title" />
            <Textarea value={settings.thankYouMessage} onChange={(e) => setSettings({ ...settings, thankYouMessage: e.target.value })} placeholder="Thank you message" rows={3} />
            <div className="flex items-center justify-between">
              <Label className="text-sm">Confetti animation</Label>
              <Switch checked={settings.confettiEnabled} onCheckedChange={(checked) => setSettings({ ...settings, confettiEnabled: checked })} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}