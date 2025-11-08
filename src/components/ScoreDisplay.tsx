"use client";

import { useState, useEffect } from "react";
import { storageUtils } from "@/utils/serverStorage";
import { AggregatedScore } from "@/types";

interface ScoreDisplayProps {
  teamId: string;
  contestId: string;
  aggregatedScore?: AggregatedScore;
}

export default function ScoreDisplay({ teamId, contestId, aggregatedScore }: ScoreDisplayProps) {
  const [score, setScore] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadScore = async () => {
      try {
        const teamScore = await storageUtils.getAggregatedScore(teamId, contestId);
        setScore(teamScore);
      } catch (error) {
        console.error('Error loading score:', error);
        setScore(0);
      } finally {
        setLoading(false);
      }
    };

    loadScore();
  }, [teamId, contestId]);

  if (loading) {
    return (
      <td className="text-center py-3 px-2">
        <span className="text-gray-400">Загрузка...</span>
      </td>
    );
  }

  return (
    <td className="text-center py-3 px-2">
      <div className="relative group">
        <span className={`inline-block px-2 py-1 rounded text-sm font-medium cursor-help ${
          score > 0
            ? aggregatedScore && aggregatedScore.juryScores.length >= 3
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
            : 'bg-gray-100 text-gray-600'
        }`}>
          {score}
          {aggregatedScore && (
            <span className="ml-1 text-xs opacity-75">
              ({aggregatedScore.juryScores.length})
            </span>
          )}
        </span>
        
        {aggregatedScore && aggregatedScore.juryScores.length > 0 && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 bg-gray-800 text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            <div className="font-semibold mb-1">Оценки жюри ({aggregatedScore.juryScores.length} из 6):</div>
            {aggregatedScore.juryScores.map((juryScore, index) => (
              <div key={index} className="flex justify-between">
                <span className="truncate mr-2">{juryScore.juryName}:</span>
                <span>{juryScore.score}</span>
              </div>
            ))}
            <div className="mt-1 pt-1 border-t border-gray-600 flex justify-between font-semibold">
              <span>Средний балл:</span>
              <span>{aggregatedScore.averageScore}</span>
            </div>
            {aggregatedScore.juryScores.length < 3 && (
              <div className="mt-1 text-yellow-300 text-xs">
                ⚠️ Оценено менее чем 3 членами жюри
              </div>
            )}
          </div>
        )}
      </div>
    </td>
  );
}