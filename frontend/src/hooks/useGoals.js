import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { goalsApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export const goalKeys = { all: () => ["goals"] };

const IMPORT_GOALS_KEY = "runlytics_import_goals";

function getImportGoals() {
  try { return JSON.parse(localStorage.getItem(IMPORT_GOALS_KEY) || "[]"); }
  catch { return []; }
}
function saveImportGoals(goals) {
  localStorage.setItem(IMPORT_GOALS_KEY, JSON.stringify(goals));
  window.dispatchEvent(new Event("runlytics:import-goals-changed"));
}

export function useGoals() {
  const { isImportMode } = useAuth();

  // Import-mode: local state backed by localStorage + DOM event
  const [importGoals, setImportGoals] = useState(() => isImportMode ? getImportGoals() : []);
  useEffect(() => {
    if (!isImportMode) return;
    const handler = () => setImportGoals(getImportGoals());
    window.addEventListener("runlytics:import-goals-changed", handler);
    return () => window.removeEventListener("runlytics:import-goals-changed", handler);
  }, [isImportMode]);

  const { data: goals = [], isPending } = useQuery({
    queryKey: goalKeys.all(),
    queryFn:  () => goalsApi.list().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    enabled:  !isImportMode,
  });

  if (isImportMode) return { goals: importGoals, loading: false };
  return { goals, loading: isPending };
}

export function useCreateGoal() {
  const { isImportMode } = useAuth();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (goalData) => goalsApi.create(goalData).then((r) => r.data),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: goalKeys.all() }),
  });

  const importCreate = async (goalData) => {
    const newGoal = { ...goalData, id: `goal_${Date.now()}`, createdAt: new Date().toISOString() };
    saveImportGoals([...getImportGoals(), newGoal]);
    return newGoal;
  };

  return isImportMode
    ? { createGoal: importCreate, creating: false }
    : { createGoal: mutateAsync, creating: isPending };
}

export function useDeleteGoal() {
  const { isImportMode } = useAuth();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (id) => goalsApi.delete(id),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: goalKeys.all() }),
  });

  const importDelete = async (id) => {
    saveImportGoals(getImportGoals().filter((g) => g.id !== id));
  };

  return isImportMode
    ? { deleteGoal: importDelete, deleting: false }
    : { deleteGoal: mutateAsync, deleting: isPending };
}
