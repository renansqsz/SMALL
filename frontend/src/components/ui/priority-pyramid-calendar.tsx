"use client";

import * as React from "react";
import { format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertCircle,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FolderOpen,
  Link2,
  Plus,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const categoryOptions = [
  { value: "reuniao", label: "Reunião" },
  { value: "alinhamento", label: "Alinhamento" },
  { value: "treinamento", label: "Treinamento" },
  { value: "apresentacao", label: "Apresentação" },
  { value: "workshop", label: "Workshop" },
] as const;

type EventCategory = (typeof categoryOptions)[number]["value"];

type Event = {
  id: string;
  title: string;
  date: Date;
  time: string;
  category: EventCategory;
  meetingLink: string;
};

const DEFAULT_TIME = "14:30";
const DEFAULT_CATEGORY: EventCategory = "reuniao";

const timeOptions = Array.from({ length: 48 }, (_, index) => {
  const hour = String(Math.floor(index / 2)).padStart(2, "0");
  const minute = index % 2 === 0 ? "00" : "30";
  const value = `${hour}:${minute}`;

  return { value, label: value };
});

function isPastScheduleDate(value: Date) {
  return startOfDay(value).getTime() < startOfDay(new Date()).getTime();
}

function combineDateAndTime(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function getCategoryLabel(category: EventCategory) {
  return categoryOptions.find((option) => option.value === category)?.label ?? category;
}

function EventField({
  children,
  invalid = false,
}: React.PropsWithChildren<{ invalid?: boolean }>) {
  return (
    <div
      className={cn(
        "rounded-[24px] border bg-white/85 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-sm transition-colors dark:bg-[#0d1a30]/80 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        invalid
          ? "border-rose-400/70 shadow-[0_0_0_1px_rgba(251,113,133,0.2)] dark:shadow-[0_0_0_1px_rgba(251,113,133,0.3)]"
          : "border-slate-200/80 dark:border-white/10",
      )}
    >
      {children}
    </div>
  );
}

export function PriorityPyramidCalendar() {
  const previewCount = 3;
  const [title, setTitle] = React.useState("");
  const [date, setDate] = React.useState<Date | undefined>();
  const [time, setTime] = React.useState(DEFAULT_TIME);
  const [category, setCategory] = React.useState<EventCategory>(DEFAULT_CATEGORY);
  const [meetingLink, setMeetingLink] = React.useState("");
  const [events, setEvents] = React.useState<Event[]>([]);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [cardsPerPage, setCardsPerPage] = React.useState(3);
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({});
  const [dateAlert, setDateAlert] = React.useState<string | null>(null);
  const [datePickerOpen, setDatePickerOpen] = React.useState(false);
  const [errors, setErrors] = React.useState({
    title: false,
    date: false,
    meetingLink: false,
  });

  React.useEffect(() => {
    const updateCardsPerPage = () => {
      if (window.innerWidth >= 1280) {
        setCardsPerPage(3);
        return;
      }

      if (window.innerWidth >= 768) {
        setCardsPerPage(2);
        return;
      }

      setCardsPerPage(1);
    };

    updateCardsPerPage();
    window.addEventListener("resize", updateCardsPerPage);
    return () => window.removeEventListener("resize", updateCardsPerPage);
  }, []);

  const orderedEvents = React.useMemo(
    () =>
      [...events].sort(
        (left, right) =>
          combineDateAndTime(left.date, left.time).getTime() -
          combineDateAndTime(right.date, right.time).getTime(),
      ),
    [events],
  );

  const groupedEvents = React.useMemo(() => {
    const groups = new Map<string, { date: Date; items: Event[] }>();

    for (const event of orderedEvents) {
      const groupDate = startOfDay(event.date);
      const key = format(groupDate, "yyyy-MM-dd");
      const current = groups.get(key) ?? { date: groupDate, items: [] };
      current.items.push(event);
      groups.set(key, current);
    }

    return Array.from(groups.entries()).map(([key, group]) => ({
      key,
      date: group.date,
      label: format(group.date, "EEEE, d 'de' MMMM", { locale: ptBR }),
      items: group.items,
    }));
  }, [orderedEvents]);

  const totalPages = Math.max(1, Math.ceil(groupedEvents.length / cardsPerPage));
  const visibleGroups = React.useMemo(() => {
    const start = pageIndex * cardsPerPage;
    return groupedEvents.slice(start, start + cardsPerPage);
  }, [cardsPerPage, groupedEvents, pageIndex]);
  const canGoPrevious = pageIndex > 0;
  const canGoNext = pageIndex < totalPages - 1;

  React.useEffect(() => {
    setPageIndex((current) => Math.min(current, totalPages - 1));
  }, [totalPages]);

  function resetForm() {
    setTitle("");
    setMeetingLink("");
    setTime(DEFAULT_TIME);
    setCategory(DEFAULT_CATEGORY);
    setDate(undefined);
    setDateAlert(null);
    setErrors({
      title: false,
      date: false,
      meetingLink: false,
    });
  }

  function addEvent() {
    const trimmedTitle = title.trim();
    const trimmedMeetingLink = meetingLink.trim();
    const nextErrors = {
      title: !trimmedTitle,
      date: !date,
      meetingLink: !trimmedMeetingLink,
    };

    setErrors(nextErrors);

    if (!trimmedTitle || !date || !trimmedMeetingLink) {
      return;
    }

    if (isPastScheduleDate(date)) {
      setDateAlert("Não é possível agendar eventos em uma data anterior.");
      setErrors((current) => ({ ...current, date: true }));
      return;
    }

    setDateAlert(null);

    setEvents((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        title: trimmedTitle,
        date,
        time,
        category,
        meetingLink: trimmedMeetingLink,
      },
    ]);

    resetForm();
  }

  function deleteEvent(eventId: string) {
    setEvents((current) => current.filter((event) => event.id !== eventId));
  }

  function toggleGroup(groupKey: string) {
    setExpandedGroups((current) => ({
      ...current,
      [groupKey]: !current[groupKey],
    }));
  }

  return (
    <div className="relative overflow-hidden rounded-[40px] border border-slate-200/80 bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.16),_transparent_32%),linear-gradient(180deg,_#f8fbff_0%,_#edf4ff_34%,_#e5eefb_100%)] p-4 shadow-[0_28px_90px_rgba(148,163,184,0.2)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top,_rgba(91,138,255,0.22),_transparent_34%),linear-gradient(180deg,_#33425b_0%,_#25334a_24%,_#18243a_100%)] dark:shadow-[0_28px_90px_rgba(15,23,42,0.16)] sm:p-6 lg:p-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(148,163,184,0.2),_transparent_28%)] dark:bg-[radial-gradient(circle_at_bottom_left,_rgba(148,163,184,0.12),_transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] [background-size:30px_30px] dark:opacity-50 dark:[background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-8">
        <Card className="mx-auto w-full max-w-4xl overflow-hidden rounded-[34px] border border-slate-200/80 bg-white/88 text-slate-900 shadow-[0_32px_90px_rgba(148,163,184,0.26)] backdrop-blur-xl dark:border-white/10 dark:bg-[#071325]/88 dark:text-slate-100 dark:shadow-[0_32px_90px_rgba(2,8,23,0.5)]">
          <div className="flex items-start gap-4 px-5 py-5 sm:px-8 sm:py-7">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-[20px] border border-blue-200/80 bg-[linear-gradient(180deg,rgba(219,234,254,0.95),rgba(191,219,254,0.92))] text-[#2563eb] shadow-[0_12px_28px_rgba(96,165,250,0.22),inset_0_1px_0_rgba(255,255,255,0.8)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(50,95,255,0.35),rgba(28,58,112,0.42))] dark:text-[#70a8ff] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <CalendarIcon className="h-8 w-8 text-inherit" />
              </div>

              <div className="space-y-1 pt-1">
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Adicionar Evento</h2>
                <p className="max-w-xl text-base text-slate-500 dark:text-slate-300">
                  Preencha os dados do evento e mantenha a agenda organizada.
                </p>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-200/90 dark:bg-white/10" />

          <CardContent className="space-y-5 px-5 py-6 sm:px-8 sm:py-8">
            {dateAlert ? (
              <div className="flex items-start gap-3 rounded-[20px] border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-100">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{dateAlert}</p>
              </div>
            ) : null}

            <EventField invalid={errors.title}>
              <div className="space-y-3">
                <Label htmlFor="titulo-evento" className="text-base font-semibold text-slate-950 dark:text-white">
                  Título do Evento
                </Label>
                <Input
                  id="titulo-evento"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    if (errors.title) {
                      setErrors((current) => ({ ...current, title: false }));
                    }
                  }}
                  placeholder="Digite o título do evento"
                  aria-invalid={errors.title}
                  className="h-14 rounded-2xl border-slate-200 bg-white text-base text-slate-950 shadow-none placeholder:text-slate-400 focus-visible:ring-[#2d69ff]/30 dark:border-white/10 dark:bg-[#101d34] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:ring-[#2d69ff]/60"
                />
              </div>
            </EventField>

            <EventField invalid={errors.meetingLink}>
              <div className="space-y-3">
                <Label htmlFor="link-reuniao" className="text-base font-semibold text-slate-950 dark:text-white">
                  Link da Reunião
                </Label>
                <div className="relative">
                  <Link2 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="link-reuniao"
                    value={meetingLink}
                    onChange={(event) => {
                      setMeetingLink(event.target.value);
                      if (errors.meetingLink) {
                        setErrors((current) => ({ ...current, meetingLink: false }));
                      }
                    }}
                    placeholder="Cole o link da reunião"
                    aria-invalid={errors.meetingLink}
                    className="h-14 rounded-2xl border-slate-200 bg-white pl-12 text-base text-slate-950 shadow-none placeholder:text-slate-400 focus-visible:ring-[#2d69ff]/30 dark:border-white/10 dark:bg-[#101d34] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:ring-[#2d69ff]/60"
                  />
                </div>
              </div>
            </EventField>

            <div className="grid gap-4 lg:grid-cols-[1.25fr_0.85fr_1fr]">
              <EventField invalid={errors.date}>
                <div className="space-y-3">
                  <Label className="text-base font-semibold text-slate-950 dark:text-white">Data</Label>
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "h-14 w-full justify-between rounded-2xl border-slate-200 bg-white px-4 text-left text-base font-medium text-slate-900 shadow-none hover:bg-slate-50 hover:text-slate-950 dark:border-white/10 dark:bg-[#101d34] dark:text-slate-100 dark:hover:bg-[#13233f] dark:hover:text-white",
                          !date && "text-slate-400 dark:text-slate-400",
                          errors.date && "border-rose-400/60 text-rose-600 dark:text-rose-200",
                        )}
                      >
                        <span>{date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}</span>
                        <CalendarIcon className="h-5 w-5 text-[#2563eb] opacity-90 dark:text-[#70a8ff]" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      className="w-auto rounded-[26px] border border-slate-200 bg-white/95 p-4 text-slate-900 shadow-[0_24px_60px_rgba(148,163,184,0.28)] backdrop-blur-xl dark:border-white/10 dark:bg-[#091425]/95 dark:text-slate-100 dark:shadow-[0_24px_60px_rgba(2,8,23,0.55)]"
                    >
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(selectedDate) => {
                          if (!selectedDate) {
                            setDate(undefined);
                            return;
                          }

                          if (isPastScheduleDate(selectedDate)) {
                            setDate(undefined);
                            setDateAlert("Não é possível agendar eventos em uma data anterior.");
                            setErrors((current) => ({ ...current, date: true }));
                            return;
                          }

                          setDate(selectedDate);
                          setDateAlert(null);
                          setDatePickerOpen(false);
                          if (errors.date) {
                            setErrors((current) => ({ ...current, date: false }));
                          }
                        }}
                        disabled={{ before: startOfDay(new Date()) }}
                        initialFocus
                        locale={ptBR}
                        modifiers={{
                          past: (day) => isPastScheduleDate(day),
                          future: (day) => !isPastScheduleDate(day),
                        }}
                        modifiersClassNames={{
                          future:
                            "[&_button]:text-emerald-700 [&_button]:hover:bg-emerald-50 [&_button]:hover:text-emerald-800 dark:[&_button]:text-emerald-300 dark:[&_button]:hover:bg-emerald-500/10 dark:[&_button]:hover:text-emerald-200",
                          past:
                            "[&_button]:text-rose-500 [&_button]:hover:text-rose-600 dark:[&_button]:text-rose-400 dark:[&_button]:hover:text-rose-300",
                        }}
                        classNames={{
                          months: "flex flex-col",
                          month: "space-y-4",
                          caption: "relative flex items-center justify-center pt-1",
                          caption_label: "text-sm font-semibold text-slate-900 dark:text-slate-100",
                          nav_button:
                            "h-8 w-8 rounded-full border border-slate-200 bg-slate-50 p-0 text-slate-500 opacity-100 hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-white",
                          table: "w-full border-collapse",
                          head_row: "flex",
                          head_cell:
                            "w-10 rounded-md text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500",
                          row: "mt-2 flex w-full",
                          cell: "h-10 w-10 p-0 text-center text-sm align-middle",
                          day: "h-10 w-10 p-0 text-center text-sm align-middle",
                          day_button:
                            "mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-transparent bg-transparent p-0 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d69ff]/30 dark:text-slate-100 dark:hover:bg-white/[0.05] dark:hover:text-white dark:focus-visible:ring-[#2d69ff]/60",
                          day_today:
                            "[&_button]:bg-emerald-50 [&_button]:text-emerald-700 [&_button]:ring-1 [&_button]:ring-inset [&_button]:ring-emerald-400/55 [&_button]:hover:bg-emerald-100 dark:[&_button]:bg-emerald-500/15 dark:[&_button]:text-emerald-200 dark:[&_button]:hover:bg-emerald-500/20",
                          day_selected:
                            "[&_button]:bg-[#2d69ff] [&_button]:text-white [&_button]:hover:bg-[#2d69ff] [&_button]:focus:bg-[#2d69ff] [&_button]:focus:text-white",
                          day_disabled:
                            "opacity-100 [&_button]:cursor-not-allowed [&_button]:text-rose-500 [&_button]:hover:bg-transparent dark:[&_button]:text-rose-400",
                          day_outside: "opacity-40 [&_button]:text-slate-400 dark:[&_button]:text-slate-600",
                        }}
                      />

                      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4 text-xs font-medium text-slate-500 dark:border-white/10 dark:text-slate-300">
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 dark:border-emerald-400/20 dark:bg-emerald-500/10">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                          Hoje e próximas
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 dark:border-rose-400/20 dark:bg-rose-500/10">
                          <span className="h-2 w-2 rounded-full bg-rose-400" />
                          Passadas
                        </span>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </EventField>

              <EventField>
                <div className="space-y-3">
                  <Label className="text-base font-semibold text-slate-950 dark:text-white">Horário</Label>
                  <Select value={time} onValueChange={setTime}>
                    <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-white px-4 text-base text-slate-950 shadow-none focus:ring-[#2d69ff]/30 dark:border-white/10 dark:bg-[#101d34] dark:text-slate-100 dark:focus:ring-[#2d69ff]/60">
                      <div className="flex items-center gap-3">
                        <Clock3 className="h-5 w-5 text-[#70a8ff]" />
                        <SelectValue placeholder="Selecione um horário" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-[#091425] dark:text-slate-100">
                      {timeOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="text-slate-900 data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-950 dark:text-slate-100 dark:data-[highlighted]:bg-white/[0.08] dark:data-[highlighted]:text-white"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </EventField>

              <EventField>
                <div className="space-y-3">
                  <Label className="text-base font-semibold text-slate-950 dark:text-white">Categoria</Label>
                  <Select value={category} onValueChange={(value) => setCategory(value as EventCategory)}>
                    <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-white px-4 text-base text-slate-950 shadow-none focus:ring-[#2d69ff]/30 dark:border-white/10 dark:bg-[#101d34] dark:text-slate-100 dark:focus:ring-[#2d69ff]/60">
                      <div className="flex items-center gap-3">
                        <FolderOpen className="h-5 w-5 text-[#70a8ff]" />
                        <SelectValue placeholder="Selecione uma categoria" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-[#091425] dark:text-slate-100">
                      {categoryOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="text-slate-900 data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-950 dark:text-slate-100 dark:data-[highlighted]:bg-white/[0.08] dark:data-[highlighted]:text-white"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </EventField>
            </div>

            <Button
              onClick={addEvent}
              className="h-16 w-full rounded-[22px] bg-[linear-gradient(135deg,#2d69ff_0%,#245ff7_60%,#3f7dff_100%)] text-xl font-semibold text-white shadow-[0_18px_42px_rgba(45,105,255,0.4)] hover:opacity-95"
            >
              <Plus className="h-6 w-6 shrink-0 text-white" />
              Adicionar Evento
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {groupedEvents.length === 0 ? (
            <Card className="rounded-[30px] border border-slate-200/80 bg-white/85 text-slate-900 shadow-[0_24px_70px_rgba(148,163,184,0.2)] backdrop-blur-xl dark:border-white/10 dark:bg-[#071325]/80 dark:text-slate-100 dark:shadow-[0_24px_70px_rgba(2,8,23,0.35)]">
              <CardContent className="py-12 text-center">
                <p className="text-lg font-medium text-slate-800 dark:text-slate-200">Nenhum evento cadastrado ainda.</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Adicione o primeiro compromisso usando data, horário e categoria.
                </p>
              </CardContent>
            </Card>
          ) : (
            <section className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Agenda cadastrada</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-300">
                    Veja os eventos organizados por data, horário e categoria.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
                    Página {pageIndex + 1} de {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setPageIndex((current) => Math.max(current - 1, 0))}
                    disabled={!canGoPrevious}
                    aria-label="Mostrar eventos anteriores"
                    className="h-11 w-11 rounded-full border-slate-200 bg-white text-slate-600 shadow-none hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100 dark:hover:bg-white/[0.08]"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setPageIndex((current) => Math.min(current + 1, totalPages - 1))}
                    disabled={!canGoNext}
                    aria-label="Mostrar próximos eventos"
                    className="h-11 w-11 rounded-full border-slate-200 bg-white text-slate-600 shadow-none hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100 dark:hover:bg-white/[0.08]"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {visibleGroups.map((group) => {
                  const isExpanded = Boolean(expandedGroups[group.key]);
                  const visibleItems = isExpanded ? group.items : group.items.slice(0, previewCount);
                  const hasHiddenItems = group.items.length > previewCount;
                  const pastGroup = isPastScheduleDate(group.date);

                  return (
                    <Card
                      key={group.key}
                      className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/88 text-slate-900 shadow-[0_22px_65px_rgba(148,163,184,0.2)] backdrop-blur-xl dark:border-white/10 dark:bg-[#071325]/82 dark:text-slate-100 dark:shadow-[0_22px_65px_rgba(2,8,23,0.38)]"
                    >
                      <div className="border-b border-slate-200/90 px-5 py-5 dark:border-white/10">
                        <div className="flex items-center justify-between gap-3">
                          <div className="space-y-2">
                            <h4 className="text-2xl font-semibold capitalize leading-tight text-slate-950 dark:text-white">
                              {group.label}
                            </h4>
                            <span
                              className={cn(
                                "inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
                                pastGroup
                                  ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200",
                              )}
                            >
                              {pastGroup ? "Encerrado" : "Disponível"}
                            </span>
                          </div>

                          <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
                            {group.items.length} {group.items.length > 1 ? "eventos" : "evento"}
                          </span>
                        </div>
                      </div>

                      <CardContent className="space-y-4 p-5">
                        {visibleItems.map((event) => (
                          <div
                            key={event.id}
                            className="rounded-[26px] border border-slate-200/90 bg-slate-50/80 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] dark:border-white/10 dark:bg-white/[0.03] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0 space-y-4">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="inline-flex rounded-full bg-[#21478a]/10 px-3.5 py-1.5 text-sm font-semibold text-[#21478a] dark:bg-[#21478a]/70 dark:text-[#bcd4ff]">
                                    {event.time}
                                  </span>
                                  <span className="inline-flex rounded-full bg-emerald-50 px-3.5 py-1.5 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                                    {getCategoryLabel(event.category)}
                                  </span>
                                </div>

                                <p className="break-words text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                                  {event.title}
                                </p>
                              </div>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteEvent(event.id)}
                                aria-label={`Excluir evento ${event.title}`}
                                className="h-10 w-10 shrink-0 rounded-2xl text-slate-400 hover:bg-slate-200/80 hover:text-slate-900 dark:hover:bg-white/[0.06] dark:hover:text-white"
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </div>

                            <a
                              href={event.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[22px] border border-[#2d69ff]/30 bg-[#2d69ff]/15 px-4 py-3 text-base font-semibold text-[#1f53d5] transition-colors hover:bg-[#2d69ff]/20 hover:text-[#143fa9] dark:text-[#dce7ff] dark:hover:bg-[#2d69ff]/25 dark:hover:text-white"
                            >
                              <Link2 className="h-5 w-5" />
                              Acessar reunião
                            </a>
                          </div>
                        ))}

                        {hasHiddenItems ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => toggleGroup(group.key)}
                            className="h-14 w-full rounded-[24px] border-slate-200 bg-white text-base font-semibold text-slate-700 shadow-none hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100 dark:hover:bg-white/[0.08]"
                          >
                            {isExpanded ? "Ocultar eventos extras" : "Mostrar os demais eventos"}
                          </Button>
                        ) : null}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
