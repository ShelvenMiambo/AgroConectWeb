import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const isDark = resolvedTheme === "dark"

  const toggle = () => setTheme(isDark ? "light" : "dark")

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className={`rounded-xl transition-all duration-300 ${className}`}
      aria-label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-yellow-400 transition-transform duration-300 rotate-0 hover:rotate-12" />
      ) : (
        <Moon className="h-5 w-5 text-slate-600 transition-transform duration-300 rotate-0 hover:-rotate-12" />
      )}
    </Button>
  )
}
