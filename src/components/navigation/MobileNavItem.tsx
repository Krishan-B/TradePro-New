
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"

interface MobileNavItemProps {
  children?: React.ReactNode
  title: string
  href: string
}

const MobileNavItem = ({ title, href }: MobileNavItemProps) => {
  const navigate = useNavigate()

  const onClick = () => {
    navigate(href)
  }

  return (
    <Button variant="ghost" className="justify-start p-0 capitalize" onClick={onClick}>
      {title}
    </Button>
  )
}

export default MobileNavItem;
