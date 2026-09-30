$ErrorActionPreference = 'Stop'

$python = Join-Path $env:LOCALAPPDATA 'Programs\Python\Python314\python.exe'
if (-not (Test-Path $python)) {
    throw "Python 3.14 was not found at $python. Install Python 3.14, then rerun this script."
}

$venv = Join-Path $PSScriptRoot '.venv'
$venvPython = Join-Path $venv 'Scripts\python.exe'

if (-not (Test-Path $venvPython)) {
    & $python -m venv $venv
}

& $venvPython -m pip install --upgrade pip
& $venvPython -m pip install torch==2.14.0+cu130 --index-url https://download.pytorch.org/whl/cu130
& $venvPython -m pip install -r (Join-Path $PSScriptRoot 'requirements.txt')
& $venvPython -c "import torch; print('PyTorch:', torch.__version__); print('CUDA available:', torch.cuda.is_available()); print('GPU:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'none'); assert torch.cuda.is_available(), 'CUDA PyTorch could not access the NVIDIA GPU.'"