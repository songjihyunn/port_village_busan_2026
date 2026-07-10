"use client";

import { useState } from "react";
import AdminNav from "@/components/admin/AdminNav";
import DashboardTab from "@/components/admin/DashboardTab";
import MapTab from "@/components/admin/MapTab";
import StaffTab from "@/components/admin/StaffTab";
import TrainingTab from "@/components/admin/TrainingTab";
import ManualTab from "@/components/admin/ManualTab";

export type AdminTab = "dashboard" | "map" | "staff" | "training" | "manual";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  return (
    <div className="flex flex-col h-screen">
      {/* Top Nav */}
      <AdminNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "map" && <MapTab />}
        {activeTab === "staff" && <StaffTab />}
        {activeTab === "training" && <TrainingTab />}
        {activeTab === "manual" && <ManualTab />}
      </main>
    </div>
  );
}
