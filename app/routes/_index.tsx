import type { DataFunctionArgs, V2_MetaFunction } from '@remix-run/node';
import { getUser } from '~/utils/user/user.server';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

export const meta: V2_MetaFunction = () => {
    return [{ title: 'New Remix App' }, { name: 'description', content: 'Welcome to Remix!' }];
};

export const loader = async ({ request }: DataFunctionArgs) => {
    const user = await getUser(request);
    return json({ user });
};

const Index = () => {
    const data = useLoaderData<typeof loader>();
    return <div>{data.user?.firstName}</div>;
};
export default Index;
