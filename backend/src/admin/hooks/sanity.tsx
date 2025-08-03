import { 
  useMutation, 
  UseMutationOptions, 
  useQueryClient, 
} from "@tanstack/react-query"
import { sdk } from "../lib/sdk"

export const useTriggerSanityProductSync = (
  id: string,
  options?: UseMutationOptions
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      sdk.client.fetch(`/admin/sanity/documents/${id}/sync`, {
        method: "post",
      }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: [`sanity_document`, `sanity_document_${id}`],
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}