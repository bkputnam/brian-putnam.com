export function fail(failContainerId: string) {
    document.body.classList.add('fail');
    document.getElementById(failContainerId)?.classList.remove('hidden');
}