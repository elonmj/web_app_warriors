import { verifyPassword } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { MatchRepository } from '@/api/repository/MatchRepository';
import { MatchService } from '@/api/services/MatchService';
import { RankingService } from '@/api/services/RankingService';
import { ValidationStatusType } from '@/types/Enums';
import { revalidatePath } from 'next/cache';

// Initialize services
const matchRepository = new MatchRepository();
const matchService = new MatchService();
const rankingService = new RankingService();

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { matchId, eventId, score, adminPassword } = body;

        if (!matchId || !eventId || !score || !adminPassword) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Verify admin password
        try {
            await verifyPassword(adminPassword);
        } catch (error) {
            return NextResponse.json(
                { error: 'Invalid admin password' },
                { status: 401 }
            );
        }

        // Get the current match data
        const match = await matchRepository.getMatch(matchId);
        if (!match) {
            return NextResponse.json(
                { error: 'Match not found' },
                { status: 404 }
            );
        }

        // Update the match using MatchService
        const result = await matchService.processMatchResult(match, {
            matchId,
            eventId,
            score: {
                player1Score: score.player1Score,
                player2Score: score.player2Score
            }
        });

        // Update rankings
        await rankingService.updateRoundRankings(eventId, match.metadata.round);

        // Revalidate related paths
        revalidatePath(`/event/${eventId}`);
        revalidatePath(`/event/${eventId}/match/${matchId}`);

        // Return the updated match
        return NextResponse.json(result.updatedMatch);
    } catch (error) {
        console.error('Error modifying match result:', error);
        return NextResponse.json(
            { error: 'Failed to modify match result' },
            { status: 500 }
        );
    }
}
