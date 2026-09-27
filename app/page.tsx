"use client";

import React, { useEffect, useState } from "react";
import { OnboardingScreen } from "@/frontend/components/onboarding-screen";
import {
  AdminDashboardView,
  AuthScreen,
  DashboardHeader,
  HomeView,
  LoadingScreen,
  MobileDrawer,
  MobileNav,
  NotificationsDialog,
  OnboardingUnavailable,
  PacesView,
  PlanView,
  ProfileView,
  RacesView,
  Sidebar,
  TestView,
  pageTitles,
} from "@/frontend/components/dashboard";
import { useDashboardState } from "@/frontend/hooks/use-dashboard-state";
import { useNotifications } from "@/frontend/hooks/use-notifications";

export default function VidaAtivaFlex(): React.JSX.Element {
  const {
    view,
    setView,
    goal,
    setGoal,
    minutes,
    setMinutes,
    seconds,
    setSeconds,
    result,
    week,
    setWeek,
    completions,
    getCompletedSessions,
    toggleCompleted,
    message,
    calculate,
    menuOpen,
    setMenuOpen,
    authStatus,
    currentUser,
    onboardingStatus,
    initialRunningProfile,
    trainingPlan,
    workouts,
    stravaStatus,
    stravaBusy,
    stravaNotice,
    clearStravaNotice,
    connectStrava,
    disconnectStrava,
    handleStravaLinked,
    logout,
    handleAuthenticated,
    handleOnboardingComplete,
    retryOnboarding,
  } = useDashboardState();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const isProfessor = currentUser?.role === "professor";

  const {
    unreadCount,
    messages: notificationMessages,
    loading: loadingNotifications,
    sending: sendingNotification,
    error: notificationsError,
    sendMessage: sendNotificationMessage,
  } = useNotifications(notificationsOpen);

  useEffect(() => {
    if (authStatus === "authenticated" && view === "admin" && !isProfessor) {
      setView("home");
    }
  }, [authStatus, view, isProfessor, setView]);

  const title = pageTitles[view];

  if (authStatus === "loading" || (authStatus === "authenticated" && ["idle", "loading"].includes(onboardingStatus))) {
    return <LoadingScreen />;
  }

  if (authStatus === "anonymous" || !currentUser) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  if (onboardingStatus === "error") {
    return <OnboardingUnavailable onRetry={retryOnboarding} onLogout={logout} />;
  }

  if (onboardingStatus === "required") {
    return (
      <OnboardingScreen
        nome={currentUser.nome}
        initialProfile={initialRunningProfile}
        onComplete={handleOnboardingComplete}
        onLogout={logout}
      />
    );
  }

  const handleToggleRole = () => {
    if (!isProfessor) return;
    setView(view === "admin" ? "home" : "admin");
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1540px]">
        <Sidebar view={view} goal={goal} onNavigate={setView} />
        <section className="min-w-0 flex-1 px-4 pb-28 pt-5 sm:px-7 lg:px-10 lg:pb-10">
          <DashboardHeader
            title={title}
            userName={currentUser.nome}
            userRole={isProfessor ? "professor" : "aluno"}
            currentView={view}
            unreadCount={unreadCount}
            onOpenMenu={() => setMenuOpen(true)}
            onOpenProfile={setView}
            onOpenNotifications={() => {
              if (isProfessor) {
                setView("admin");
              } else {
                setNotificationsOpen(true);
              }
            }}
            onToggleRole={isProfessor ? handleToggleRole : undefined}
          />

          {stravaNotice && (
            <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-[#FC5200]/25 bg-[#FC5200]/10 px-4 py-3 text-sm text-white" role="status">
              <span>{stravaNotice}</span>
              <button type="button" onClick={clearStravaNotice} className="shrink-0 text-xs font-black text-[#FC5200]">
                Fechar
              </button>
            </div>
          )}

          <div className="mt-7">
            {view === "home" && (
              <HomeView
                result={result}
                goal={goal}
                workouts={workouts}
                trainingPlan={trainingPlan}
                completed={getCompletedSessions(trainingPlan ? 1 : week)}
                onNavigate={setView}
                onToggle={(session) => void toggleCompleted(trainingPlan ? 1 : week, session)}
              />
            )}
            {view === "test" && (
              <TestView
                minutes={minutes}
                seconds={seconds}
                result={result}
                message={message}
                onMinutes={setMinutes}
                onSeconds={setSeconds}
                onCalculate={() => calculate()}
                onSeePaces={() => setView("paces")}
              />
            )}
            {view === "paces" && <PacesView result={result} onRetest={() => setView("test")} />}
            {view === "plan" && (
              <PlanView
                goal={goal}
                result={result}
                week={week}
                workouts={workouts}
                trainingPlan={trainingPlan}
                completions={completions}
                stravaStatus={stravaStatus}
                onWeek={setWeek}
                onToggle={(weekNumber, session) => void toggleCompleted(weekNumber, session)}
                onConnectStrava={connectStrava}
                onStravaLinked={handleStravaLinked}
              />
            )}
            {view === "races" && <RacesView />}
            {view === "profile" && (
              <ProfileView
                user={currentUser}
                goal={goal}
                result={result}
                onGoal={setGoal}
                onRetest={() => setView("test")}
                onLogout={logout}
                stravaStatus={stravaStatus}
                stravaBusy={stravaBusy}
                onConnectStrava={connectStrava}
                onDisconnectStrava={disconnectStrava}
                onOpenSupport={() => setNotificationsOpen(true)}
                onOpenAdmin={isProfessor ? () => setView("admin") : undefined}
              />
            )}
            {view === "admin" && isProfessor && (
              <AdminDashboardView currentUserId={currentUser.idAluno} />
            )}
          </div>
        </section>
      </div>

      <MobileNav view={view} onNavigate={setView} />
      {menuOpen && (
        <MobileDrawer
          view={view}
          onNavigate={(next) => {
            setView(next);
            setMenuOpen(false);
          }}
          onClose={() => setMenuOpen(false)}
        />
      )}

      <NotificationsDialog
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        messages={notificationMessages}
        loading={loadingNotifications}
        sending={sendingNotification}
        error={notificationsError}
        onSendMessage={sendNotificationMessage}
      />
    </main>
  );
}
