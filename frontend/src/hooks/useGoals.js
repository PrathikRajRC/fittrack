import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { goalsApi } from "../services/api.js";

export const goalKeys = {
  all: () => ["goals"],
};

export function useGoals() {
  const { data: goals = [], isPending } = useQuery({
    queryKey: goalKeys.all(),
    queryFn:  () => goalsApi.list().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
  return { goals, loading: isPending };
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (goalData) => goalsApi.create(goalData).then((r) => r.data),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: goalKeys.all() }),
  });
  return { createGoal: mutateAsync, creating: isPending };
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (id) => goalsApi.delete(id),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: goalKeys.all() }),
  });
  return { deleteGoal: mutateAsync, deleting: isPending };
}
