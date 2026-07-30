import { Suspense } from "react"
import { SuccessClient } from "./success-client"

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden bg-noise flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/95 backdrop-blur-[1px] pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md">
        <Suspense fallback={<div className="h-64 flex items-center justify-center">Chargement...</div>}>
          <SuccessClient />
        </Suspense>
      </div>
    </div>
  )
}
