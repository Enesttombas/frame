$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$lessonRoot = $PSScriptRoot
$utterances = @(
 'We often overlook the power of small steps.',
 'A tiny habit can make a remarkable difference over time.',
 'The key is to stay consistent, even when progress feels slow.',
 'Instead of waiting for motivation, create a simple routine.',
 'When you come across a new word, notice how it is used.',
 'Try to recall the meaning before you look it up.',
 'Each small effort builds momentum for the next one.',
 'You do not have to be perfect. You just have to keep going.'
)
$lessonSynth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$lessonSynth.SelectVoice('Microsoft Zira Desktop')
$lessonSynth.Rate = -1
try {
 for ($lessonIndex = 0; $lessonIndex -lt $utterances.Count; $lessonIndex++) {
  $lessonSynth.SetOutputToWaveFile((Join-Path $lessonRoot "media\voice-$lessonIndex.wav"))
  $lessonSynth.Speak($utterances[$lessonIndex])
  $lessonSynth.SetOutputToNull()
 }
} finally { $lessonSynth.Dispose() }
Write-Output '8 original lesson utterances synthesized locally.'
