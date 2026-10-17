<#
.SYNOPSIS
  将 dsh-ui-ux-pro-max 插件安装到 DSH 的 profile。
.DESCRIPTION
  1) 按 package.json 的 files[] 白名单复制发布物（不再整目录复制）
  2) 在 profile 的 cordis.patch.yml 追加 insert 条目（幂等）
  3) 打印重启提示
  默认自动探测 desktop / web profile；可用 -ProfileDir 或 -ProfileName 指定。
  可用 -WhatIf 预览而不写入。
.PARAMETER ProfileDir
  显式指定 profile 目录，如 C:\Users\me\.dsh\profiles\desktop。
.PARAMETER ProfileName
  自动探测时优先使用的 profile：auto / desktop / web（默认 auto）。
.PARAMETER Force
  目标已存在时覆盖复制。
.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\install.ps1
.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\install.ps1 -ProfileName web
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [string]$ProfileDir,
  [ValidateSet('auto', 'desktop', 'web')]
  [string]$ProfileName = 'auto',
  [switch]$Force
)

$ErrorActionPreference = 'Stop'
$PluginName = 'dsh-ui-ux-pro-max'
$PluginId = 'ui-ux-pro-max'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProfilesRoot = Join-Path $HOME '.dsh\profiles'

function Resolve-ProfileDir {
  param([string]$ExplicitDir, [string]$Name)
  if ($ExplicitDir) { return $ExplicitDir }
  $candidates = if ($Name -eq 'auto') { @('desktop', 'web') } else { @($Name) }
  foreach ($candidateName in $candidates) {
    $candidate = Join-Path $ProfilesRoot $candidateName
    if (Test-Path $candidate) { return $candidate }
  }
  $available = @()
  if (Test-Path $ProfilesRoot) {
    $available = Get-ChildItem $ProfilesRoot -Directory -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name
  }
  throw "找不到 DSH profile。已探测: $($candidates -join ', ')。可用 profile: $($available -join ', ')。请用 -ProfileDir 或 -ProfileName 指定。"
}

Write-Host '== dsh-ui-ux-pro-max 安装脚本 ==' -ForegroundColor Cyan
Write-Host "插件源目录   : $ScriptDir"

# ---------- 0. 校验 ----------
$PackageJson = Join-Path $ScriptDir 'package.json'
if (-not (Test-Path $PackageJson)) {
  Write-Error "当前目录不是插件包根目录（缺少 package.json）：$ScriptDir"
  exit 1
}
$pkg = Get-Content $PackageJson -Raw -Encoding UTF8 | ConvertFrom-Json
$entries = @($pkg.files)
if ($entries.Count -eq 0) {
  Write-Error 'package.json 的 files[] 为空，无法确定发布物白名单。'
  exit 1
}

try {
  $ProfileDir = Resolve-ProfileDir -ExplicitDir $ProfileDir -Name $ProfileName
} catch {
  Write-Warning $_.Exception.Message
  exit 1
}
if (-not (Test-Path $ProfileDir)) {
  Write-Warning "找不到 profile 目录：$ProfileDir"
  Write-Warning '若 DSH 的 profile 不在默认位置，请用 -ProfileDir 指定。'
  exit 1
}
# profile 目录（如 .dsh\profiles\desktop）的包依赖被提升（hoisted）到同级共享
# node_modules（如 .dsh\profiles\node_modules），插件包应安装到那里。
$NodeModules = Join-Path (Split-Path -Parent $ProfileDir) 'node_modules'
$TargetDir = Join-Path $NodeModules $PluginName
$PatchFile = Join-Path $ProfileDir 'cordis.patch.yml'

Write-Host "Profile 目录 : $ProfileDir"
Write-Host "安装目标     : $TargetDir"
Write-Host "发布物条目   : $($entries -join ', ')"

# ---------- 1. 按 files[] 白名单复制 ----------
if ($PSCmdlet.ShouldProcess($TargetDir, "复制插件发布物到 $TargetDir")) {
  if (-not (Test-Path $NodeModules)) { New-Item -ItemType Directory -Path $NodeModules -Force | Out-Null }
  if ((Test-Path $TargetDir) -and -not $Force) {
    Write-Host "已存在 $TargetDir，跳过复制（用 -Force 覆盖）。" -ForegroundColor Yellow
  } else {
    if (Test-Path $TargetDir) { Remove-Item $TargetDir -Recurse -Force }
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
    foreach ($entry in $entries) {
      $source = Join-Path $ScriptDir $entry
      if (-not (Test-Path $source)) {
        Remove-Item $TargetDir -Recurse -Force
        Write-Error "files[] 条目不存在：$entry"
        exit 1
      }
      $dest = Join-Path $TargetDir $entry
      $destParent = Split-Path -Parent $dest
      if (-not (Test-Path $destParent)) { New-Item -ItemType Directory -Path $destParent -Force | Out-Null }
      if ((Get-Item $source).PSIsContainer) {
        Copy-Item -Path $source -Destination $dest -Recurse -Force
      } else {
        Copy-Item -Path $source -Destination $dest -Force
      }
    }
    Write-Host "✅ 已按 files[] 复制插件包 → $TargetDir" -ForegroundColor Green
  }
}

# ---------- 2. 追加 cordis.patch.yml insert 条目 ----------
$entry = @"
- insert:
    - id: $PluginId
      name: $PluginName
      config: {}
"@

if ($PSCmdlet.ShouldProcess($PatchFile, "追加 insert 条目到 $PatchFile")) {
  $exists = $false
  if (Test-Path $PatchFile) {
    $content = Get-Content $PatchFile -Raw -Encoding UTF8
    $exists = $content -match "id:\s*$PluginId"
  }
  if ($exists) {
    Write-Host "cordis.patch.yml 已包含 $PluginId 条目，跳过。" -ForegroundColor Yellow
  } else {
    if (Test-Path $PatchFile) { Copy-Item $PatchFile "$PatchFile.bak" -Force }
    Add-Content -Path $PatchFile -Value $entry -Encoding UTF8
    Write-Host "✅ 已在 $PatchFile 追加 insert 条目（原文件备份为 cordis.patch.yml.bak）" -ForegroundColor Green
  }
}

# ---------- 3. 校验 ----------
$ok = $true
if (-not (Test-Path (Join-Path $TargetDir 'index.js'))) {
  Write-Warning "警告：$TargetDir 缺少 index.js，插件可能未复制成功。"
  $ok = $false
}
if (-not (Test-Path (Join-Path $TargetDir 'lib'))) {
  Write-Warning "警告：$TargetDir 缺少 lib/ 目录。"
  $ok = $false
}
if (Test-Path $PatchFile) {
  $content = Get-Content $PatchFile -Raw -Encoding UTF8
  if ($content -notmatch "id:\s*$PluginId") {
    Write-Warning '警告：cordis.patch.yml 中未找到插件条目。'
    $ok = $false
  }
}

Write-Host ''
if ($ok) {
  Write-Host '✅ 安装完成。下一步：' -ForegroundColor Green
  Write-Host '  1) 重启 DSH Desktop（重新加载 profile 的 cordis.patch.yml）'
  Write-Host '  2) 新会话中模型即可调用 design_recommend / design_review / design_search'
  Write-Host '  3) 验证：向模型提问「用 design_recommend 生成一个金融 SaaS 数据看板的设计系统」'
} else {
  Write-Warning '安装未完全成功，请检查上方警告。'
  exit 1
}
