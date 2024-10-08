'use client';

import { YEARS } from '@/lib/constants';
import { FullRoster, Player, PlayoffRound, Team } from '@/lib/types';
import { Box, Button, Group, MultiSelect, Select } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { redirect, revalidateTag } from '../actions';
import Link from 'next/link';
import { useSWRConfig } from 'swr';

interface Props {
    roster?: FullRoster;
    players: Player[];
    teams: Team[];
    playoffRounds: PlayoffRound[];
}

export default function RosterForm({
    roster,
    players,
    teams,
    playoffRounds,
}: Props) {
    const { mutate } = useSWRConfig();
    const schema = z.object({
        year: z
            .string()
            .length(4)
            .refine((data) => YEARS.includes(data), {
                message: 'Invalid year',
            }),
        team: z
            .string()
            .refine(
                (data) => teams.some((team) => team.teamID === parseInt(data)),
                {
                    message: 'Invalid team',
                }
            ),
        playoffRound: z
            .string()
            .refine(
                (data) =>
                    data === '' ||
                    playoffRounds.some(
                        (round) => round.playoffRoundID === parseInt(data)
                    ),
                {
                    message: 'Invalid Playoff Round',
                }
            ),
        players: z
            .string()
            .array()
            .length(5, { message: 'Need to give 5 players per roster' })
            .refine(
                (data) => {
                    for (const p of data) {
                        if (
                            players.some(
                                (player) => player.playerID !== parseInt(p)
                            )
                        ) {
                            return true;
                        }
                    }
                    return false;
                },
                { message: 'Invalid player given' }
            ),
    });

    type Schema = z.infer<typeof schema>;

    const form = useForm({
        initialValues: {
            year: roster?.year || '',
            team: roster?.teamID.toString() || '',
            playoffRound: roster?.playoffRoundID?.toString() || '',
            players: roster?.players.map((p) => p.playerID.toString()) || [],
        },
        validate: zodResolver(schema),
    });

    async function post(data: Schema) {
        return fetch('/api/rosters', {
            method: 'POST',
            body: JSON.stringify({
                year: data.year,
                teamID: parseInt(data.team),
                playoffRoundID: data.playoffRound
                    ? parseInt(data.playoffRound)
                    : null,
                playerIDs: data.players.map((p) => parseInt(p)),
            }),
        });
    }

    async function put(data: Schema) {
        return fetch(`/api/rosters/${roster?.rosterID}`, {
            method: 'PUT',
            body: JSON.stringify({
                year: data.year,
                teamID: parseInt(data.team),
                playoffRoundID: data.playoffRound
                    ? parseInt(data.playoffRound)
                    : null,
                playerIDs: data.players.map((p) => parseInt(p)),
            }),
        });
    }

    async function handleSubmit(data: Schema) {
        try {
            if (!roster) {
                await post(data);
            } else {
                await put(data);
            }
            mutate('/api/rosters');
            revalidateTag('rosters');
            redirect('/rosters');
        } catch (err) {
            console.error(err);
        }
    }

    const teamOption = teams.map((team) => ({
        value: team.teamID.toString(),
        label: `${team.city} ${team.name}`,
    }));

    const playoffRoundOption = [
        { value: '', label: '-' },
        ...playoffRounds.map((round) => ({
            value: round.playoffRoundID.toString(),
            label: round.name,
        })),
    ];

    const playerOption = players.map((player) => ({
        value: player.playerID.toString(),
        label: `${player.firstName} ${player.lastName}`,
    }));

    return (
        <Box mx='auto'>
            <form
                onSubmit={form.onSubmit((values) =>
                    handleSubmit(values as unknown as Schema)
                )}
            >
                <Select
                    withAsterisk
                    label='Year'
                    placeholder='Select year'
                    data={YEARS}
                    searchable
                    {...form.getInputProps('year')}
                />
                <Select
                    withAsterisk
                    label='Team'
                    placeholder='Harlem Globetrotters'
                    data={teamOption}
                    searchable
                    {...form.getInputProps('team')}
                />
                <Select
                    label='Playoff Round'
                    placeholder='None'
                    data={playoffRoundOption}
                    searchable
                    {...form.getInputProps('playoffRound')}
                />
                <MultiSelect
                    label='Players'
                    withAsterisk
                    placeholder='Pick 5 players'
                    data={playerOption}
                    maxValues={5}
                    searchable
                    {...form.getInputProps('players')}
                />
                <Group justify='flex-end' mt='md'>
                    <Button component={Link} href='/rosters'>
                        Cancel
                    </Button>
                    <Button type='submit'>Apply</Button>
                </Group>
            </form>
        </Box>
    );
}
