using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using TreeApi.Models;
using TreeApi.Services;

namespace TreeApi.Controllers
{
	[ApiController]
	[Route("[controller]")]
	public class TreeController : ControllerBase
	{
		private readonly ITreeManager _treeManager;

		public TreeController(ITreeManager treeManager) => _treeManager = treeManager;

		[HttpGet]
		public async Task<Node> GetRoot() => await _treeManager.GetRootWithRecursiveChildrenAsync();

		[HttpPut]
		public async Task ApplyChanges([FromBody]ChangeModel model) => await _treeManager.ApplyChangesAsync(model);

		[HttpPost("reset")]
		public async Task Reset() => await _treeManager.ResetAsync();
	}
}
