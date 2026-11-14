// Legacy editors are not part of the public browsing site. These local errors
// deliberately register no server functions and make no upload/delete requests.
export async function storeImageFn(_input: { data: FormData }): Promise<{
  fileModel: { id: string; content: { src: string } }
}> {
  throw new Error("Account uploads are no longer available.")
}

export async function deleteImageFn(_input: { data: string }): Promise<void> {
  throw new Error("Account uploads are no longer available.")
}
