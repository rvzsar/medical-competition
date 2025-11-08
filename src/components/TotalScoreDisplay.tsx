"use client";

import { useState, useEffect } from "react";
import { storageUtils } from "@/utils/serverStorage";

interface TotalScoreDisplayProps {
  teamId: string;
}

export default function TotalScoreDisplay({ teamId }: TotalScoreDisplayProps) {
  const [score, setScore] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadScore = async () => {
      try {
        const teamScore = await storageUtils.getTeamTotalScore(teamId);
        setScore(teamScore);
      } catch (error) {
        console.error('Error loading total score:', error);
        setScore(0);
      } finally {
        setLoading(false);
      }
    };

    loadScore();
  }, [teamId]);

  if (loading) {
    return <span className="text-gray-400">Загрузка...</span>;
  }

  return <span>{score}</span>;
}