"use client";

import { useState, useEffect } from "react";
import { storageUtils } from "@/utils/serverStorage";

interface TeamScoreLoaderProps {
  teamId: string;
}

export default function TeamScoreLoader({ teamId }: TeamScoreLoaderProps) {
  const [score, setScore] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadScore = async () => {
      try {
        const teamScore = await storageUtils.getTeamTotalScore(teamId);
        setScore(teamScore);
      } catch (error) {
        console.error('Error loading team score:', error);
        setScore(0);
      } finally {
        setLoading(false);
      }
    };

    loadScore();
  }, [teamId]);

  if (loading) {
    return <span className="text-blue-600">Загрузка...</span>;
  }

  return <span className="text-blue-600">{score}</span>;
}