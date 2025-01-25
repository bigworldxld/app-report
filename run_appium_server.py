import subprocess
def run_command(cmd):
    res=subprocess.run(cmd, shell=True)
    if res.returncode != 0:
        print(f"Error: running command: {cmd}:::{res.stderr}")
    else:
        print(res.stdout)
def run_appium_server():
    cmd = "appium --allow-cors --config ./config/.appiumrc.json"
    run_command(cmd)
run_appium_server()