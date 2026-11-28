import { useLayoutEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { DashboardLayout } from "./components/layout/DashboardLayout.jsx";
import { PublicLayout } from "./components/layout/PublicLayout.jsx";
import { RequireAuth } from "./components/layout/RequireAuth.jsx";
import { PageTitle } from "./components/ui.jsx";
import { ForgotPage, LoginPage, RegisterPage, ResetPage, VerifyPage } from "./features/auth/AuthPages.jsx";
import { ChatPage } from "./features/chat/ChatPage.jsx";
import { AdminDashboard, CoachDashboard, StudentDashboard } from "./features/dashboard/Dashboards.jsx";
import { AnnouncementsPage, AttendancePage, BannersAdminPage, BatchesPage, CoachesAdminPage, ContentPage, EnquiriesPage, GalleryAdminPage, ProgramsAdminPage, StudentsPage } from "./features/manage/OfficePages.jsx";
import { AdmissionsPage } from "./features/manage/AdmissionsPage.jsx";
import { NotificationsPage } from "./features/notifications/NotificationsPage.jsx";
import { ProfilePage } from "./features/profile/ProfilePage.jsx";
import { CoachesPage, ContactPage, GalleryPage, HomePage, ProgramsPage, StoryPage } from "./features/public/PublicPages.jsx";
import { FacilitiesPage } from "./features/public/FacilitiesPage.jsx";
import { GlobalLoading } from "./components/GlobalLoading.jsx";

export function App() {
  return (
    <>
      <ScrollToTop />
      <GlobalLoading />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<StoryPage slug="about" />} />
          <Route path="programs" element={<ProgramsPage />} />
          <Route path="coaches" element={<CoachesPage />} />
          <Route path="facilities" element={<FacilitiesPage />} />
          <Route path="gallery" element={<GalleryPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="verify" element={<VerifyPage />} />
          <Route path="forgot" element={<ForgotPage />} />
          <Route path="reset" element={<ResetPage />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route element={<DashboardLayout />}>
            <Route path="app/profile" element={<ProfilePage />} />
            <Route path="app/chat" element={<ChatPage />} />
            <Route path="app/notifications" element={<NotificationsPage />} />
            <Route path="app/announcements" element={<AnnouncementsPage />} />
            <Route path="app/batches" element={<BatchesPage />} />
            <Route path="app/attendance" element={<AttendancePage />} />
            <Route path="app/students" element={<StudentsPage />} />
            <Route element={<RequireAuth roles={["admin"]} />}>
              <Route path="app/admin" element={<AdminDashboard />} />
              <Route path="app/admissions" element={<AdmissionsPage />} />
              <Route path="app/coaches" element={<CoachesAdminPage />} />
              <Route path="app/programs" element={<ProgramsAdminPage />} />
              <Route path="app/enquiries" element={<EnquiriesPage />} />
              <Route path="app/content" element={<ContentPage />} />
              <Route path="app/banners" element={<BannersAdminPage />} />
              <Route path="app/gallery" element={<GalleryAdminPage />} />
            </Route>
            <Route element={<RequireAuth roles={["coach"]} />}>
              <Route path="app/coach" element={<CoachDashboard />} />
            </Route>
            <Route element={<RequireAuth roles={["student"]} />}>
              <Route path="app/student" element={<StudentDashboard />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<MissingPage />} />
      </Routes>
    </>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}

function MissingPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-cream px-4">
      <PageTitle title="Not found" />
      <div>
        <h1 className="font-serif text-4xl text-pitch">That page is not on the ground.</h1>
        <a className="mt-4 inline-block text-fairway" href="/">Back to the academy</a>
      </div>
    </main>
  );
}
