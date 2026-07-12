import { NextRequest, NextResponse } from 'next/server';
import { FirebaseMatchRepository } from '@/api/repository/FirebaseMatchRepository';
import { FirebaseEventRepository } from '@/api/repository/FirebaseEventRepository';
import { MatchStatus, ValidationStatusType } from '@/types/Enums';
import { calculatePR, calculateSpread } from '@/lib/scoring';

const matchRepository = new FirebaseMatchRepository();
const eventRepository = new FirebaseEventRepository();

export async function POST(request: NextRequest) {
  try {
    // Verify admin auth token (simplified for example)
    // In a real app, you'd validate the token from Authorization header
    
    const { matchId, eventId, score, status } = await request.json();
    
    if (!matchId || !eventId) {
      return NextResponse.json({ error: 'matchId and eventId are required' }, { status: 400 });
    }
    
    // Get the match
    const match = await matchRepository.getMatch(matchId);
    
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }
    
    // Basic updates
    const updates: any = {};
    
    if (score) {
      if (typeof score.player1Score !== 'number' || typeof score.player2Score !== 'number') {
        return NextResponse.json({ error: 'Invalid score format' }, { status: 400 });
      }
      
      if (match.result) {
        // Update existing result — keep PR/spread coherent with the corrected score
        updates.result = {
          ...match.result,
          score: [score.player1Score, score.player2Score],
          pr: calculatePR(score.player1Score, score.player2Score),
          ds: calculateSpread(score.player1Score, score.player2Score)
        };
      } else {
        // Create new result with basic values
        updates.result = {
          score: [score.player1Score, score.player2Score],
          pr: calculatePR(score.player1Score, score.player2Score),
          ds: calculateSpread(score.player1Score, score.player2Score),
          validation: {
            status: 'admin_validated',
            player1Approved: true,
            player2Approved: true,
            timestamp: new Date().toISOString()
          }
        };
      }
    }
    
    if (status) {
      updates.status = status;
    }
    
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }
    
    // Add admin modification metadata
    updates.metadata = {
      ...match.metadata,
      adminModified: true,
      adminModifiedAt: new Date().toISOString()
    };
    
    // Apply updates
    await eventRepository.updateEventMatch(eventId, matchId, updates);
    
    // Get updated match
    const updatedMatch = await matchRepository.getMatch(matchId);
    
    return NextResponse.json(updatedMatch);
  } catch (error) {
    console.error('Error modifying match:', error);
    return NextResponse.json({ error: 'Failed to modify match' }, { status: 500 });
  }
}

