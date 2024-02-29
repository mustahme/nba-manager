import { turso } from '@/lib/db/turso';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const { rows } = await turso.execute('SELECT * FROM Players');
        return NextResponse.json(rows);
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { message: (err as Error).message },
            { status: 400 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const { firstName, lastName } = await request.json();
        await turso.execute({
            sql: 'INSERT INTO Players (firstName, lastName) VALUES (?, ?)',
            args: [firstName, lastName],
        });
        const { rows } = await turso.execute({
            sql: 'SELECT * FROM Players WHERE firstName=? AND lastName=? ORDER BY playerID DESC LIMIT 1',
            args: [firstName, lastName],
        });
        return NextResponse.json(rows[0], { status: 201 });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { message: (err as Error).message },
            { status: 400 }
        );
    }
}
