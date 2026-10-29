"use client";
import { useLewta } from "@/components/LewtaContext";
import { TopBar } from "@/components/layout/TopBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { MusicSelector } from "@/components/layout/MusicSelector";
import { WelcomeScreen } from "@/components/screens/WelcomeScreen";
import { AuthScreen } from "@/components/screens/AuthScreen";
import { GuestScreen } from "@/components/screens/GuestScreen";
import { HubScreen } from "@/components/screens/HubScreen";
import { CityScreen } from "@/components/screens/CityScreen";
import { GameScreen } from "@/components/games/GameScreen";
import { ResultsScreen } from "@/components/screens/ResultsScreen";
import { PassportScreen } from "@/components/screens/PassportScreen";
import { ProfileScreen } from "@/components/screens/ProfileScreen";
import { RevisitScreen } from "@/components/screens/RevisitScreen";
import { HowToPlayScreen } from "@/components/screens/HowToPlayScreen";
import { TeacherLoginScreen, TeacherScreen } from "@/components/screens/TeacherScreens";

/** Page frame from the V10 prototype: header, side menu, soundtrack bar, phone menu. */
export function AppShell({ notice, onCloseNotice }: { notice: string; onCloseNotice: () => void }) {
  const { page, teacherAuthorized } = useLewta();
  const formPage = page === "register" || page === "login" || page === "guest";
  const screen = (() => {
    switch (page) {
      case "welcome": return <WelcomeScreen />;
      case "register": return <AuthScreen kind="register" />;
      case "login": return <AuthScreen kind="login" />;
      case "guest": return <GuestScreen />;
      case "hub": return <HubScreen />;
      case "city": return <CityScreen />;
      case "game": return <GameScreen />;
      case "results": return <ResultsScreen />;
      case "passport": return <PassportScreen />;
      case "profile": return <ProfileScreen />;
      case "revisit": return <RevisitScreen />;
      case "how": return <HowToPlayScreen />;
      case "teacher-login": return <TeacherLoginScreen />;
      case "teacher": return teacherAuthorized ? <TeacherScreen /> : <TeacherLoginScreen />;
      default: return <HubScreen />;
    }
  })();
  return <>
    <div className="stars" aria-hidden="true" />
    {page === "welcome" ? screen : <>
      <TopBar menu={!formPage} />
      {formPage ? screen : <><div className="shell"><Sidebar /><main><MusicSelector />{screen}</main></div></>}
    </>}
    {notice && <div className="lewta-toast" role="status"><span aria-hidden="true">✨</span><p>{notice}</p><button aria-label="Close notification" onClick={onCloseNotice}>✕</button></div>}
  </>;
}
