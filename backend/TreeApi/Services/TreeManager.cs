using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TreeApi.Extensions;
using TreeApi.Models;

namespace TreeApi.Services
{
	public interface ITreeManager
	{
		Task<Node> GetRootWithRecursiveChildrenAsync();
		Task<Node> GetNodeByIdAsync(long id);
		Task<List<long>> FilterOutNotRemovedIds(HashSet<long> ids);
		Task ResetAsync();
		Task ApplyChangesAsync(ChangeModel changeModel);
	}

	public class TreeManager : ITreeManager
	{
		private readonly ITreeDbContextProvider _contextProvider;

		public TreeManager(ITreeDbContextProvider contextProvider)
		{
			_contextProvider = contextProvider;
		}

		public async Task<Node> GetRootWithRecursiveChildrenAsync()
		{
			using var context = _contextProvider.CreateContext();

			var allNodes = await context.Nodes.ToListAsync();
			return allNodes.SingleOrDefault(x => x.ParentId == null);
		}

		public async Task ResetAsync()
		{
			using var context = _contextProvider.CreateContext();
			await context.ResetAsync();
		}

		public async Task ApplyChangesAsync(ChangeModel changeModel)
		{
			await insertAsync(changeModel.NodesToInsert);
			await updateAsync(changeModel.NodesToUpdate);
			await removeAsync(changeModel.NodesToRemove);
		}

		public async Task<Node> GetNodeByIdAsync(long id)
		{
			using var context = _contextProvider.CreateContext();
			return await context.Nodes.SingleAsync(x => x.Id == id);
		}

		private async Task insertAsync(List<NewNodeDto> nodeDtos)
		{
			if (nodeDtos == null || nodeDtos.Count == 0)
			{
				return;
			}

			using var context = _contextProvider.CreateContext();

			Node mapDto(NewNodeDto dto) => new Node
			{
				Id = dto.Id,
				Name = dto.Name,
				ParentId = dto.ParentId,
				Children = dto.Children.Select(mapDto).ToHashSet()
			};

			var dbNodes = nodeDtos.Select(mapDto).ToList();

			await context.AddRangeAsync(dbNodes);
			await context.SaveChangesAsync();
		}

		private async Task updateAsync(Dictionary<string, string> map)
		{
			if (map == null || map.Count == 0)
			{
				return;
			}

			using var context = _contextProvider.CreateContext();

			foreach (var pair in map)
			{
				var node = new Node
				{
					Id = long.Parse(pair.Key),
					Name = pair.Value
				};

				context.Entry(node).Property(x => x.Name).IsModified = true;
			}

			await context.SaveChangesAsync();
		}

		private async Task removeAsync(HashSet<long> ids)
		{
			if (ids == null || ids.Count == 0)
			{
				return;
			}

			using var context = _contextProvider.CreateContext();
			context.ChangeTracker.QueryTrackingBehavior = QueryTrackingBehavior.NoTracking;

			foreach (var id in ids)
			{
				var node = new Node
				{
					Id = id,
					IsRemoved = true
				};

				context.Entry(node).Property(x => x.IsRemoved).IsModified = true;
			}

			await context.SaveChangesAsync();

			/* Cascade mark all children as removed without recursion */
			const int numberOfItemsInBatch = 2;

			var parentIdsQueue = new Queue<long>(ids);

			while (parentIdsQueue.TryDequeue(out long parentId))
			{
				var childrenCount = await context.Nodes.LongCountAsync(x => x.ParentId == parentId);
				var numberOfBatches = (long)Math.Ceiling(childrenCount / (double)numberOfItemsInBatch);

				for (var i = 1; i <= numberOfBatches; i++)
				{
					var childrenIds =
						await context.Nodes
							.Where(x => x.ParentId == parentId)
							.Skip((i - 1) * numberOfItemsInBatch)
							.Take(numberOfItemsInBatch)
							.Select(x => x.Id)
							.ToListAsync();

					childrenIds.ForEach(id =>
					{
						var node = new Node
						{
							Id = id,
							IsRemoved = true
						};

						context.Entry(node).Property(x => x.IsRemoved).IsModified = true;

						parentIdsQueue.Enqueue(id);
					});

					await context.SaveChangesAsync();
				}
			}
		}

		public async Task<List<long>> FilterOutNotRemovedIds(HashSet<long> ids)
		{
			if (ids == null || ids.Count == 0)
			{
				return new List<long>();
			}

			using var context = _contextProvider.CreateContext();

			return await context.Nodes
				.Where(x => x.IsRemoved && ids.Contains(x.Id))
				.Select(x => x.Id)
				.ToListAsync();
		}
	}
}
