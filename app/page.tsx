import { pageUser } from '@/lib/auth/pages';
import Workspace from '@/components/workspace';
export const dynamic='force-dynamic';
export default async function Home(){const user=await pageUser();return <Workspace user={user}/>;}
