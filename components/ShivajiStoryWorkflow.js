'use client';

import { useMemo, useState } from 'react';
import { generateVideo } from '@/packages/studio/src/muapi.js';
import { t2vModels } from '@/packages/studio/src/models.js';
import storyPlan from '@/content/scene-prompts-10min-shivaji.json';

const TEST_SCENE_COUNT = 6;
const TEST_CLIP_DURATION = 5;

function formatSeconds(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export default function ShivajiStoryWorkflow({ apiKey, onClose }) {
  // For the first real test, generate 6 different 5-second scenes = 30 seconds total.
  // This keeps the test small while verifying that each scene uses its own prompt.
  const scenes = (storyPlan.scenes || []).slice(0, TEST_SCENE_COUNT);
  const defaultModel = t2vModels[0];
  const [currentScene, setCurrentScene] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);
  const [requestId, setRequestId] = useState(null);

  const totalDuration = useMemo(
    () => scenes.length * TEST_CLIP_DURATION,
    [scenes.length]
  );

  const generateCurrentScene = async () => {
    const scene = scenes[currentScene];
    if (!scene || generating) return;

    setGenerating(true);
    setError('');
    setRequestId(null);

    try {
      const result = await generateVideo(apiKey, {
        model: defaultModel.id,
        prompt: `${scene.prompt}. This is test clip ${scene.scene} of a 30-second children's story. Keep the same young Shivaji character design, clothing, 3D children's animation style, and visual continuity across the story. Child-safe, gentle, non-violent. ${storyPlan.negative_prompt}`,
        aspect_ratio: storyPlan.aspect_ratio || '16:9',
        duration: TEST_CLIP_DURATION,
        onRequestId: setRequestId,
      });

      const url = result?.url || result?.outputs?.[0] || null;
      if (!url) throw new Error('MuAPI completed the request but returned no video URL.');

      setResults((previous) => [
        ...previous.filter((item) => item.scene !== scene.scene),
        { scene: scene.scene, title: scene.title, url },
      ]);

      if (currentScene < scenes.length - 1) setCurrentScene((value) => value + 1);
    } catch (err) {
      setError(err?.message || 'Video generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const resetTest = () => {
    setCurrentScene(0);
    setResults([]);
    setError('');
    setRequestId(null);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/85 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#0b0b0b] border border-white/10 rounded-3xl shadow-2xl">
        <div className="sticky top-0 z-10 bg-[#0b0b0b]/95 backdrop-blur border-b border-white/10 px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-[#d9ff00] text-[10px] font-black uppercase tracking-[0.2em]">Kids Story Test</p>
            <h2 className="text-white text-xl font-black mt-1">Generate 30-Second Shivaji Story</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-2xl">×</button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/5 rounded-2xl p-4"><div className="text-white/40 text-[10px] uppercase font-bold">Clips</div><div className="text-white text-xl font-black mt-1">{scenes.length}</div></div>
            <div className="bg-white/5 rounded-2xl p-4"><div className="text-white/40 text-[10px] uppercase font-bold">Test length</div><div className="text-white text-xl font-black mt-1">{formatSeconds(totalDuration)}</div></div>
            <div className="bg-white/5 rounded-2xl p-4"><div className="text-white/40 text-[10px] uppercase font-bold">Each clip</div><div className="text-white text-xl font-black mt-1">5 sec</div></div>
            <div className="bg-white/5 rounded-2xl p-4"><div className="text-white/40 text-[10px] uppercase font-bold">Format</div><div className="text-white text-xl font-black mt-1">16:9</div></div>
          </div>

          <div className="bg-[#d9ff00]/5 border border-[#d9ff00]/20 rounded-2xl p-4">
            <p className="text-[#d9ff00] text-sm font-bold">30-second test mode</p>
            <p className="text-white/50 text-xs mt-1">The test creates 6 separate 5-second clips. Each clip uses a different story scene prompt, then you can combine them into one 30-second video. Use a production MuAPI key for real AI-generated video; a Sandbox key may return mock/test output.</p>
          </div>

          <div className="space-y-2">
            {scenes.map((scene, index) => {
              const result = results.find((item) => item.scene === scene.scene);
              return (
                <div key={scene.scene} className={`rounded-2xl border p-4 ${index === currentScene ? 'border-[#d9ff00]/40 bg-[#d9ff00]/5' : 'border-white/5 bg-white/[0.02]'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/50 text-xs font-black">{scene.scene}</div>
                    <div className="flex-1 min-w-0"><div className="text-white text-sm font-bold truncate">{scene.title}</div><div className="text-white/30 text-xs">Clip duration: {TEST_CLIP_DURATION}s</div></div>
                    {result?.url ? <span className="text-[#d9ff00] text-xs font-bold">Ready</span> : index === currentScene ? <span className="text-white/40 text-xs">Next</span> : null}
                  </div>
                  {result?.url && <video className="w-full rounded-xl mt-3 bg-black" controls src={result.url} />}
                </div>
              );
            })}
          </div>

          {requestId && <p className="text-white/30 text-[11px] font-mono break-all">Request: {requestId}</p>}
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-2xl p-4 text-sm">{error}</div>}

          <div className="flex gap-3">
            <button onClick={generateCurrentScene} disabled={generating || currentScene >= scenes.length} className="flex-1 bg-[#d9ff00] text-black font-black py-3 rounded-2xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
              {generating ? 'Generating 5-second clip…' : currentScene === 0 ? 'Generate Clip 1 of 6' : `Generate Clip ${currentScene + 1} of 6`}
            </button>
            {results.length > 0 && <button onClick={resetTest} disabled={generating} className="px-5 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 disabled:opacity-40">Reset</button>}
            <button onClick={onClose} className="px-5 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10">Close</button>
          </div>

          {currentScene >= scenes.length && <p className="text-center text-[#d9ff00] font-bold text-sm">All 6 test clips have been generated — 30 seconds total.</p>}
        </div>
      </div>
    </div>
  );
}
